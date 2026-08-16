import { Dispatch, RefObject, SetStateAction, useCallback, useState } from "react";
import {
    getPlanCapacity,
    memoBlocksToHtml,
    planTableToSource,
    layoutArrangement,
    layoutBoardPlan,
    type BoardArrangement,
    type BoardBounds,
    type BoardDeletion,
    type BoardEdit,
    type BoardPlan,
    type GeneratedImage,
} from "@/lib/ai/board-plan";
import type { BoardImage } from "@/hooks/useBoardImages";
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

// 고치기는 이미 저장된 카드의 내용을 바꾸므로, 취소하면 되돌릴 수 있게 이전 값을 들고 있는다.
type PendingEdits = {
    memos: BoardMemo[];
    mermaids: BoardMermaid[];
    tables: BoardTable[];
};

const emptyPendingEdits: PendingEdits = { memos: [], mermaids: [], tables: [] };

// 삭제는 저장 전까지 화면에서만 지운다. 취소하면 원래 카드를 그대로 되살린다.
type PendingDeletions = {
    memos: BoardMemo[];
    mermaids: BoardMermaid[];
    tables: BoardTable[];
    images: BoardImage[];
};

const emptyPendingDeletions: PendingDeletions = { memos: [], mermaids: [], tables: [], images: [] };

// AI가 만든 이미지는 저장 시점에 업로드하므로 그때까지 File을 카드에 들고 있는다.
// 미리보기는 수동 업로드와 같은 Object URL 방식을 쓴다.
const base64ToFile = (data: string, mimeType: string, name: string) => {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }

    return new File([bytes], name, { type: mimeType });
};

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
    images: BoardImage[];
    setImages: Dispatch<SetStateAction<BoardImage[]>>;
    onInsertImage: (
        tempId: number, file: File, boardId: number,
        x: number, y: number, z: number, width: number, height: number,
    ) => Promise<void>;
    onDeleteMemo: (id: number) => Promise<void>;
    onDeleteMermaid: (id: number) => Promise<void>;
    onDeleteTable: (id: number) => Promise<void>;
    onDeleteImage: (imageId: number, publicId: string) => Promise<void>;
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
    images,
    setImages,
    onInsertImage,
    onDeleteMemo,
    onDeleteMermaid,
    onDeleteTable,
    onDeleteImage,
}: UseAiAssistantOptions) {
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
    const [messages, setMessages] = useState<AiChatMessage[]>([]);
    const [sending, setSending] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pendingCards, setPendingCards] = useState<PendingCards>(emptyPendingCards);
    const [pendingMoves, setPendingMoves] = useState<PendingMoves>(emptyPendingMoves);
    const [pendingEdits, setPendingEdits] = useState<PendingEdits>(emptyPendingEdits);
    const [pendingDeletions, setPendingDeletions] = useState<PendingDeletions>(emptyPendingDeletions);
    const [pendingImageIds, setPendingImageIds] = useState<number[]>([]);

    const hasPendingCards =
        pendingCards.memoIds.length > 0 ||
        pendingCards.mermaidIds.length > 0 ||
        pendingCards.tableIds.length > 0 ||
        pendingImageIds.length > 0 ||
        pendingMoves.memos.length > 0 ||
        pendingMoves.mermaids.length > 0 ||
        pendingMoves.tables.length > 0 ||
        pendingEdits.memos.length > 0 ||
        pendingEdits.mermaids.length > 0 ||
        pendingEdits.tables.length > 0 ||
        pendingDeletions.memos.length > 0 ||
        pendingDeletions.mermaids.length > 0 ||
        pendingDeletions.tables.length > 0 ||
        pendingDeletions.images.length > 0;

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

        // 고쳐 놓은 카드는 이전 내용으로, 지운 카드는 원래대로 되살린다.
        const revert = <T extends { id: number }>(cards: T[], previous: T[], removed: T[]) => {
            const previousById = new Map(previous.map((card) => [card.id, card]));
            const reverted = cards.map((card) => previousById.get(card.id) ?? card);

            return removed.length > 0 ? [...reverted, ...removed] : reverted;
        };

        setMemos((prev) =>
            revert(
                restore(prev.filter((memo) => !pendingCards.memoIds.includes(memo.id)), pendingMoves.memos),
                pendingEdits.memos,
                pendingDeletions.memos
            )
        );
        setMermaids((prev) =>
            revert(
                restore(prev.filter((card) => !pendingCards.mermaidIds.includes(card.id)), pendingMoves.mermaids),
                pendingEdits.mermaids,
                pendingDeletions.mermaids
            )
        );
        setTables((prev) =>
            revert(
                restore(prev.filter((card) => !pendingCards.tableIds.includes(card.id)), pendingMoves.tables),
                pendingEdits.tables,
                pendingDeletions.tables
            )
        );
        setImages((prev) => {
            // 저장하지 않은 AI 이미지는 Object URL을 해제해야 메모리에 남지 않는다.
            prev
                .filter((image) => pendingImageIds.includes(image.imageId))
                .forEach((image) => URL.revokeObjectURL(image.secureUrl));

            const kept = prev.filter((image) => !pendingImageIds.includes(image.imageId));

            return pendingDeletions.images.length > 0 ? [...kept, ...pendingDeletions.images] : kept;
        });

        setPendingCards(emptyPendingCards);
        setPendingMoves(emptyPendingMoves);
        setPendingEdits(emptyPendingEdits);
        setPendingDeletions(emptyPendingDeletions);
        setPendingImageIds([]);
    }, [
        pendingCards,
        pendingMoves,
        pendingEdits,
        pendingDeletions,
        pendingImageIds,
        setMemos,
        setMermaids,
        setTables,
        setImages,
    ]);

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

    const applyPlan = (plan: BoardPlan, generatedImages: GeneratedImage[] = []) => {
        const planned = layoutBoardPlan(plan, getPlanOrigin(), boardBounds, generatedImages);
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

        // 이미지는 저장할 때 업로드하므로 File을 카드에 들고 있고, 미리보기는 Object URL을 쓴다.
        const newImages: BoardImage[] = planned.images.map((image, index) => {
            const file = base64ToFile(image.data, image.mimeType, `ai-image-${index + 1}.png`);

            return {
                imageId: nextTempId(),
                boardId,
                publicId: "",
                secureUrl: URL.createObjectURL(file),
                fileName: image.alt,
                file,
                x: image.x,
                y: image.y,
                z: 1,
                width: image.width,
                height: image.height,
            };
        });

        setMemos((prev) => [...prev, ...newMemos]);
        setMermaids((prev) => [...prev, ...newMermaids]);
        setTables((prev) => [...prev, ...newTables]);
        setImages((prev) => [...prev, ...newImages]);
        setPendingCards({
            memoIds: newMemos.map((memo) => memo.id),
            mermaidIds: newMermaids.map((mermaid) => mermaid.id),
            tableIds: newTables.map((table) => table.id),
        });
        setPendingImageIds(newImages.map((image) => image.imageId));

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
            images: images
                .filter((image) => image.imageId > 0)
                .map((image) => ({
                    id: image.imageId,
                    summary: (image.fileName ?? "이미지").slice(0, 120),
                })),
            capacity: getPlanCapacity(boardBounds),
        };
    };

    // 고치기: 바꾸기 전 카드를 pendingEdits에 남겨 두고 화면을 먼저 갱신한다.
    const applyEdit = (edit: BoardEdit) => {
        const memoEdits = new Map((edit.memos ?? []).map((item) => [item.id, item]));
        const mermaidEdits = new Map((edit.mermaids ?? []).map((item) => [item.id, item]));
        const tableEdits = new Map((edit.tables ?? []).map((item) => [item.id, item]));

        const changedMemos = memos.filter((memo) => memoEdits.has(memo.id));
        const changedMermaids = mermaids.filter((card) => mermaidEdits.has(card.id));
        const changedTables = tables.filter((card) => tableEdits.has(card.id));
        const changedCount = changedMemos.length + changedMermaids.length + changedTables.length;

        if (changedCount === 0) {
            return 0;
        }

        setMemos((prev) =>
            prev.map((memo) => {
                const change = memoEdits.get(memo.id);

                if (!change) {
                    return memo;
                }

                return {
                    ...memo,
                    content: change.blocks ? memoBlocksToHtml(change.blocks) : memo.content,
                    color: change.color ?? memo.color,
                };
            })
        );
        setMermaids((prev) =>
            prev.map((card) => {
                const change = mermaidEdits.get(card.id);
                return change ? { ...card, source: change.source } : card;
            })
        );
        setTables((prev) =>
            prev.map((card) => {
                const change = tableEdits.get(card.id);
                return change
                    ? { ...card, source: planTableToSource(change.columns, change.rows) }
                    : card;
            })
        );

        // 같은 카드를 연달아 고쳐도 맨 처음 값으로 되돌아가도록 이미 기록된 카드는 덮지 않는다.
        setPendingEdits((prev) => {
            const keep = <T extends { id: number }>(previous: T[], candidates: T[]) => {
                const known = new Set(previous.map((card) => card.id));
                return [...previous, ...candidates.filter((card) => !known.has(card.id))];
            };

            return {
                memos: keep(prev.memos, changedMemos),
                mermaids: keep(prev.mermaids, changedMermaids),
                tables: keep(prev.tables, changedTables),
            };
        });

        return changedCount;
    };

    // 지우기: 저장 전까지는 화면에서만 사라진다. 원본을 들고 있다가 취소하면 되살린다.
    const applyDeletion = (deletion: BoardDeletion) => {
        const memoIds = new Set(deletion.memoIds ?? []);
        const mermaidIds = new Set(deletion.mermaidIds ?? []);
        const tableIds = new Set(deletion.tableIds ?? []);
        const imageIds = new Set(deletion.imageIds ?? []);

        const removedMemos = memos.filter((memo) => memoIds.has(memo.id));
        const removedMermaids = mermaids.filter((card) => mermaidIds.has(card.id));
        const removedTables = tables.filter((card) => tableIds.has(card.id));
        // 아직 저장되지 않은 이미지는 삭제 대상이 아니다.
        const removedImages = images.filter((image) => imageIds.has(image.imageId) && image.imageId > 0);
        const removedCount =
            removedMemos.length + removedMermaids.length + removedTables.length + removedImages.length;

        if (removedCount === 0) {
            return 0;
        }

        setMemos((prev) => prev.filter((memo) => !memoIds.has(memo.id)));
        setMermaids((prev) => prev.filter((card) => !mermaidIds.has(card.id)));
        setTables((prev) => prev.filter((card) => !tableIds.has(card.id)));
        setImages((prev) => prev.filter((image) => !imageIds.has(image.imageId) || image.imageId < 0));

        setPendingDeletions((prev) => ({
            memos: [...prev.memos, ...removedMemos],
            mermaids: [...prev.mermaids, ...removedMermaids],
            tables: [...prev.tables, ...removedTables],
            images: [...prev.images, ...removedImages],
        }));

        return removedCount;
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

            if (data.plan || data.arrangement || data.edit || data.deletion) {
                // 이전 제안이 남아 있으면 걷어내고 새 제안만 보여준다.
                if (hasPendingCards) {
                    discardPendingCards();
                }
            }

            if (data.plan) {
                const result = applyPlan(data.plan, data.images ?? []);
                const requestedImages = data.plan.sections.filter(
                    (section: { attachment?: { type?: string } }) => section.attachment?.type === "image"
                ).length;
                const madeImages = (data.images ?? []).length;

                if (requestedImages > madeImages) {
                    notes.push(`그림 ${requestedImages - madeImages}장은 만들지 못해 건너뛰었습니다.`);
                }
                if (result.droppedSections > 0) {
                    notes.push(
                        `보드에 자리가 없어 ${result.droppedSections}개 섹션은 배치하지 못했습니다. 보드를 정리하거나 더 큰 보드를 쓰세요.`
                    );
                }
            }

            if (data.edit) {
                const changed = applyEdit(data.edit);

                if (changed === 0) {
                    notes.push("고칠 카드를 보드에서 찾지 못했습니다.");
                }
            }

            if (data.deletion) {
                const removed = applyDeletion(data.deletion);

                if (removed === 0) {
                    notes.push("지울 카드를 보드에서 찾지 못했습니다.");
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

            // AI가 만든 그림은 이 시점에 Cloudinary로 올라간다. 저장하지 않으면 업로드도 없다.
            for (const imageId of pendingImageIds) {
                const image = images.find((item) => item.imageId === imageId);
                if (!image?.file) {
                    continue;
                }
                await onInsertImage(
                    image.imageId, image.file, image.boardId,
                    image.x, image.y, image.z, image.width, image.height,
                );
            }

            // 고친 카드는 현재 화면 값 그대로 PATCH한다.
            for (const previous of pendingEdits.memos) {
                const memo = memos.find((item) => item.id === previous.id);
                if (!memo) {
                    continue;
                }
                await onUpdateMemo(
                    memo.id, memo.boardId, memo.content,
                    memo.x, memo.y, memo.z, memo.width, memo.height, memo.color,
                );
            }

            for (const previous of pendingEdits.mermaids) {
                const mermaid = mermaids.find((item) => item.id === previous.id);
                if (!mermaid) {
                    continue;
                }
                await onUpdateMermaid(
                    mermaid.id, mermaid.boardId, mermaid.source,
                    mermaid.x, mermaid.y, mermaid.z, mermaid.width, mermaid.height,
                );
            }

            for (const previous of pendingEdits.tables) {
                const table = tables.find((item) => item.id === previous.id);
                if (!table) {
                    continue;
                }
                await onUpdateTable(table);
            }

            // 지우기는 마지막에 확정한다. 앞 단계가 실패해도 원본이 남아 있게 한다.
            for (const memo of pendingDeletions.memos) {
                await onDeleteMemo(memo.id);
            }
            for (const mermaid of pendingDeletions.mermaids) {
                await onDeleteMermaid(mermaid.id);
            }
            for (const table of pendingDeletions.tables) {
                await onDeleteTable(table.id);
            }
            for (const image of pendingDeletions.images) {
                await onDeleteImage(image.imageId, image.publicId);
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
            setPendingEdits(emptyPendingEdits);
            setPendingDeletions(emptyPendingDeletions);
            setPendingImageIds([]);
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
