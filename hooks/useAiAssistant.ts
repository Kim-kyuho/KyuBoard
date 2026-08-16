import { Dispatch, RefObject, SetStateAction, useCallback, useState } from "react";
import {
    getPlanCapacity,
    layoutArrangement,
    layoutBoardPlan,
    type BoardArrangement,
    type BoardBounds,
    type BoardPlan,
} from "@/lib/ai/board-plan";
import type { BoardMemo } from "@/hooks/useBoardMemos";
import type { BoardMermaid } from "@/hooks/useBoardMermaids";
import type { BoardTable } from "@/hooks/useBoardTables";

export type AiChatMessage = {
    role: "user" | "assistant";
    content: string;
};

export type AiStatus = {
    available: boolean;
    message: string | null;
};

// AI가 만든 카드는 임시 카드로만 올라간다. 사용자가 저장을 눌러야 DB에 들어간다.
type PendingCards = {
    memoIds: number[];
    mermaidIds: number[];
    tableIds: number[];
};

const emptyPendingCards: PendingCards = { memoIds: [], mermaidIds: [], tableIds: [] };

// 재배치는 이미 저장된 카드를 움직이므로, 취소하면 되돌릴 수 있게 이전 좌표를 들고 있는다.
type MovedCard = { id: number; x: number; y: number; previousX: number; previousY: number };

type PendingMoves = {
    memos: MovedCard[];
    mermaids: MovedCard[];
    tables: MovedCard[];
};

const emptyPendingMoves: PendingMoves = { memos: [], mermaids: [], tables: [] };

// 새 카드 열은 기존 카드들의 오른쪽 끝 바깥에서 시작해 겹치지 않게 한다.
const newColumnGap = 120;

// 재배치는 보드 전체를 다시 정리하는 것이므로 항상 보드 왼쪽 위에서 시작한다.
const boardMarginOrigin = 40;

type UseAiAssistantOptions = {
    boardId: number;
    boardWidth: number;
    boardHeight: number;
    boardZoom: number;
    cardLocationRef: RefObject<HTMLDivElement | null>;
    canEditCard: boolean;
    showPermissionMessage: () => void;
    setPermissionMessage: (message: string) => void;
    memos: BoardMemo[];
    mermaids: BoardMermaid[];
    tables: BoardTable[];
    setMemos: Dispatch<SetStateAction<BoardMemo[]>>;
    setMermaids: Dispatch<SetStateAction<BoardMermaid[]>>;
    setTables: Dispatch<SetStateAction<BoardTable[]>>;
    onInsertMemo: (
        tempId: number, boardId: number, content: string,
        x: number, y: number, z: number, width: number, height: number, color: string,
    ) => Promise<void>;
    onInsertMermaid: (
        tempId: number, boardId: number, source: string,
        x: number, y: number, z: number, width: number, height: number,
    ) => Promise<void>;
    onInsertTable: (table: BoardTable) => Promise<void>;
    onUpdateMemo: (
        id: number, boardId: number, content: string,
        x: number, y: number, z: number, width: number, height: number, color: string,
    ) => Promise<void>;
    onUpdateMermaid: (
        id: number, boardId: number, source: string,
        x: number, y: number, z: number, width: number, height: number,
    ) => Promise<void>;
    onUpdateTable: (table: BoardTable) => Promise<void>;
};

export function useAiAssistant({
    boardId,
    boardWidth,
    boardHeight,
    boardZoom,
    cardLocationRef,
    canEditCard,
    showPermissionMessage,
    setPermissionMessage,
    memos,
    mermaids,
    tables,
    setMemos,
    setMermaids,
    setTables,
    onInsertMemo,
    onInsertMermaid,
    onInsertTable,
    onUpdateMemo,
    onUpdateMermaid,
    onUpdateTable,
}: UseAiAssistantOptions) {
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
    const [messages, setMessages] = useState<AiChatMessage[]>([]);
    const [sending, setSending] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pendingCards, setPendingCards] = useState<PendingCards>(emptyPendingCards);
    const [pendingMoves, setPendingMoves] = useState<PendingMoves>(emptyPendingMoves);

    const hasPendingCards =
        pendingCards.memoIds.length > 0 ||
        pendingCards.mermaidIds.length > 0 ||
        pendingCards.tableIds.length > 0 ||
        pendingMoves.memos.length > 0 ||
        pendingMoves.mermaids.length > 0 ||
        pendingMoves.tables.length > 0;

    const boardBounds: BoardBounds = { width: boardWidth, height: boardHeight };

    // 서버에 AI_API_KEY가 설정돼 있고 이 사용자가 쓸 권한이 있는지 확인한다.
    const refreshAiStatus = useCallback(async () => {
        const response = await fetch("/api/ai/status");
        const data = await response.json();

        if (!data.ok) {
            return null;
        }

        const status: AiStatus = { available: data.available, message: data.message ?? null };
        setAiStatus(status);

        return status;
    }, []);

    // 아직 저장하지 않은 AI 카드를 보드에서 걷어내고, 재배치는 원래 좌표로 되돌린다.
    const discardPendingCards = useCallback(() => {
        const restore = <T extends { id: number; x: number; y: number }>(cards: T[], moves: MovedCard[]) => {
            if (moves.length === 0) {
                return cards;
            }
            const moveById = new Map(moves.map((move) => [move.id, move]));

            return cards.map((card) => {
                const move = moveById.get(card.id);
                return move ? { ...card, x: move.previousX, y: move.previousY } : card;
            });
        };

        setMemos((prev) =>
            restore(prev.filter((memo) => !pendingCards.memoIds.includes(memo.id)), pendingMoves.memos)
        );
        setMermaids((prev) =>
            restore(prev.filter((card) => !pendingCards.mermaidIds.includes(card.id)), pendingMoves.mermaids)
        );
        setTables((prev) =>
            restore(prev.filter((card) => !pendingCards.tableIds.includes(card.id)), pendingMoves.tables)
        );
        setPendingCards(emptyPendingCards);
        setPendingMoves(emptyPendingMoves);
    }, [pendingCards, pendingMoves, setMemos, setMermaids, setTables]);

    const handleToggleAiPanel = async () => {
        if (aiPanelOpen) {
            setAiPanelOpen(false);
            return;
        }

        if (!canEditCard) {
            showPermissionMessage();
            return;
        }

        const status = aiStatus ?? (await refreshAiStatus());

        if (!status?.available) {
            setPermissionMessage(status?.message ?? "The AI assistant is unavailable.");
            return;
        }

        setAiPanelOpen(true);
    };

    // 기존 카드 오른쪽 바깥에 새 열을 잡고, 현재 보이는 화면 높이에 맞춰 시작점을 정한다.
    const getPlanOrigin = () => {
        const rightEdges = [
            ...memos.map((memo) => memo.x + memo.width),
            ...mermaids.map((mermaid) => mermaid.x + mermaid.width),
            ...tables.map((table) => table.x + table.width),
        ];
        const locationElement = cardLocationRef.current;
        const viewportTop = locationElement ? locationElement.scrollTop / boardZoom : 0;

        return {
            x: rightEdges.length > 0 ? Math.max(...rightEdges) + newColumnGap : newColumnGap,
            y: viewportTop + 80,
        };
    };

    const applyPlan = (plan: BoardPlan) => {
        const planned = layoutBoardPlan(plan, getPlanOrigin(), boardBounds);
        // 임시 ID는 증가하도록 만들어, 저장 전에도 메모 탐색 순서가 문서 순서와 같게 유지한다.
        const idBase = -Date.now();
        let idOffset = 0;
        const nextTempId = () => idBase + idOffset++;

        const newMemos: BoardMemo[] = planned.memos.map((memo) => ({
            id: nextTempId(),
            boardId,
            content: memo.content,
            x: memo.x,
            y: memo.y,
            z: 1,
            width: memo.width,
            height: memo.height,
            color: memo.color,
        }));
        const newMermaids: BoardMermaid[] = planned.mermaids.map((mermaid) => ({
            id: nextTempId(),
            boardId,
            source: mermaid.source,
            x: mermaid.x,
            y: mermaid.y,
            z: 1,
            width: mermaid.width,
            height: mermaid.height,
        }));
        const newTables: BoardTable[] = planned.tables.map((table) => ({
            id: nextTempId(),
            boardId,
            source: table.source,
            x: table.x,
            y: table.y,
            z: 1,
            width: table.width,
            height: table.height,
        }));

        setMemos((prev) => [...prev, ...newMemos]);
        setMermaids((prev) => [...prev, ...newMermaids]);
        setTables((prev) => [...prev, ...newTables]);
        setPendingCards({
            memoIds: newMemos.map((memo) => memo.id),
            mermaidIds: newMermaids.map((mermaid) => mermaid.id),
            tableIds: newTables.map((table) => table.id),
        });

        // 새 열이 화면 밖이면 사용자가 결과를 볼 수 없으므로 그쪽으로 이동한다.
        const locationElement = cardLocationRef.current;
        if (locationElement && newMemos[0]) {
            locationElement.scrollTo({
                left: Math.max(0, newMemos[0].x * boardZoom - 120),
                top: Math.max(0, newMemos[0].y * boardZoom - 120),
                behavior: "smooth",
            });
        }

        return { droppedSections: planned.droppedSections, placed: newMemos.length };
    };

    // 이미 저장된 카드를 옮긴다. 좌표만 로컬에 반영하고, 이전 좌표는 되돌리기용으로 남긴다.
    const applyArrangement = (arrangement: BoardArrangement) => {
        const arranged = layoutArrangement(
            arrangement,
            { memos, mermaids, tables },
            { x: boardMarginOrigin, y: boardMarginOrigin },
            boardBounds
        );

        const toMoves = <T extends { id: number; x: number; y: number }>(
            cards: T[],
            moves: { id: number; x: number; y: number }[]
        ): MovedCard[] => {
            const cardById = new Map(cards.map((card) => [card.id, card]));

            return moves.flatMap((move) => {
                const card = cardById.get(move.id);
                if (!card || (card.x === move.x && card.y === move.y)) {
                    return [];
                }
                return [{ ...move, previousX: card.x, previousY: card.y }];
            });
        };

        const memoMoves = toMoves(memos, arranged.memos);
        const mermaidMoves = toMoves(mermaids, arranged.mermaids);
        const tableMoves = toMoves(tables, arranged.tables);

        const applyMoves = <T extends { id: number; x: number; y: number }>(cards: T[], moves: MovedCard[]) => {
            if (moves.length === 0) {
                return cards;
            }
            const moveById = new Map(moves.map((move) => [move.id, move]));

            return cards.map((card) => {
                const move = moveById.get(card.id);
                return move ? { ...card, x: move.x, y: move.y } : card;
            });
        };

        setMemos((prev) => applyMoves(prev, memoMoves));
        setMermaids((prev) => applyMoves(prev, mermaidMoves));
        setTables((prev) => applyMoves(prev, tableMoves));
        setPendingMoves({ memos: memoMoves, mermaids: mermaidMoves, tables: tableMoves });

        const locationElement = cardLocationRef.current;
        if (locationElement && arranged.memos[0]) {
            locationElement.scrollTo({
                left: Math.max(0, arranged.memos[0].x * boardZoom - 120),
                top: Math.max(0, arranged.memos[0].y * boardZoom - 120),
                behavior: "smooth",
            });
        }

        return { droppedSections: arranged.droppedSections, moved: memoMoves.length };
    };

    // 모델이 재배치 대상을 고를 수 있도록 현재 보드 카드 목록을 요약해 보낸다.
    const getBoardSnapshot = () => {
        const stripHtml = (html: string) =>
            html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

        return {
            memos: memos
                .filter((memo) => memo.id > 0)
                .map((memo) => ({ id: memo.id, summary: stripHtml(memo.content).slice(0, 120) || "(빈 메모)" })),
            mermaids: mermaids
                .filter((card) => card.id > 0)
                .map((card) => ({ id: card.id, summary: card.source.split("\n")[0].slice(0, 120) })),
            tables: tables
                .filter((card) => card.id > 0)
                .map((card) => ({
                    id: card.id,
                    summary: card.source.columns.map((column) => column.name).join(", ").slice(0, 120),
                })),
            capacity: getPlanCapacity(boardBounds),
        };
    };

    const handleSendMessage = async (text: string) => {
        const content = text.trim();

        if (!content || sending) {
            return;
        }

        const nextMessages: AiChatMessage[] = [...messages, { role: "user", content }];
        setMessages(nextMessages);
        setSending(true);

        try {
            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    boardId,
                    messages: nextMessages.slice(-20),
                    snapshot: getBoardSnapshot(),
                }),
            });
            const data = await response.json();

            if (!data.ok) {
                setPermissionMessage(data.message ?? "The AI assistant could not respond.");
                setMessages(nextMessages);
                return;
            }

            const notes: string[] = [];

            if (data.plan || data.arrangement) {
                // 이전 제안이 남아 있으면 걷어내고 새 제안만 보여준다.
                if (hasPendingCards) {
                    discardPendingCards();
                }
            }

            if (data.plan) {
                const result = applyPlan(data.plan);
                if (result.droppedSections > 0) {
                    notes.push(
                        `보드에 자리가 없어 ${result.droppedSections}개 섹션은 배치하지 못했습니다. 보드를 정리하거나 더 큰 보드를 쓰세요.`
                    );
                }
            }

            if (data.arrangement) {
                const result = applyArrangement(data.arrangement);
                if (result.moved === 0) {
                    notes.push("옮길 카드가 없었습니다.");
                }
                if (result.droppedSections > 0) {
                    notes.push(`보드에 자리가 없어 카드 ${result.droppedSections}장은 그대로 두었습니다.`);
                }
            }

            setMessages([
                ...nextMessages,
                { role: "assistant", content: [data.reply, ...notes].filter(Boolean).join("\n\n") },
            ]);
        } catch (error) {
            console.error("Error sending AI message:", error);
            setPermissionMessage("The AI assistant could not respond.");
        } finally {
            setSending(false);
        }
    };

    // 메모를 순서대로 저장해야 serial ID 순서가 곧 문서 순서가 된다.
    const handleSavePendingCards = async () => {
        if (!hasPendingCards || saving) {
            return;
        }

        setSaving(true);

        try {
            for (const memoId of pendingCards.memoIds) {
                const memo = memos.find((item) => item.id === memoId);
                if (!memo) {
                    continue;
                }
                await onInsertMemo(
                    memo.id, memo.boardId, memo.content,
                    memo.x, memo.y, memo.z, memo.width, memo.height, memo.color,
                );
            }

            for (const mermaidId of pendingCards.mermaidIds) {
                const mermaid = mermaids.find((item) => item.id === mermaidId);
                if (!mermaid) {
                    continue;
                }
                await onInsertMermaid(
                    mermaid.id, mermaid.boardId, mermaid.source,
                    mermaid.x, mermaid.y, mermaid.z, mermaid.width, mermaid.height,
                );
            }

            for (const tableId of pendingCards.tableIds) {
                const table = tables.find((item) => item.id === tableId);
                if (!table) {
                    continue;
                }
                await onInsertTable(table);
            }

            // 재배치로 옮긴 기존 카드는 좌표만 PATCH한다.
            for (const move of pendingMoves.memos) {
                const memo = memos.find((item) => item.id === move.id);
                if (!memo) {
                    continue;
                }
                await onUpdateMemo(
                    memo.id, memo.boardId, memo.content,
                    move.x, move.y, memo.z, memo.width, memo.height, memo.color,
                );
            }

            for (const move of pendingMoves.mermaids) {
                const mermaid = mermaids.find((item) => item.id === move.id);
                if (!mermaid) {
                    continue;
                }
                await onUpdateMermaid(
                    mermaid.id, mermaid.boardId, mermaid.source,
                    move.x, move.y, mermaid.z, mermaid.width, mermaid.height,
                );
            }

            for (const move of pendingMoves.tables) {
                const table = tables.find((item) => item.id === move.id);
                if (!table) {
                    continue;
                }
                await onUpdateTable({ ...table, x: move.x, y: move.y });
            }

            setPendingCards(emptyPendingCards);
            setPendingMoves(emptyPendingMoves);
        } finally {
            setSaving(false);
        }
    };

    return {
        aiPanelOpen,
        aiStatus,
        messages,
        sending,
        saving,
        hasPendingCards,
        refreshAiStatus,
        handleToggleAiPanel,
        handleSendMessage,
        handleSavePendingCards,
        discardPendingCards,
    };
}
