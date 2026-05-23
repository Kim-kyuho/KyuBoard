import { useState } from "react";

export type BoardMemo = {
    id: number;
    boardId: number;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    isPublic: boolean;
};

type UseBoardMemosOptions = {
    initialMemos: BoardMemo[];
    boardId: number;
    canEditMemos: boolean;
    showPermissionMessage: () => void;
    setPermissionMessage: (message: string) => void;
};

export function useBoardMemos({
    initialMemos,
    boardId,
    canEditMemos,
    showPermissionMessage,
    setPermissionMessage,
}: UseBoardMemosOptions) {
    // 메모 리스트 상태
    const [memos, setMemos] = useState(initialMemos);

    // 메모 생성을 위한 핸들러 - 보드 영역 클릭 시 해당 위치에 임시 메모 생성
    const handleCreateTempMemo = (x: number, y: number) => {
        if (!canEditMemos) {
            showPermissionMessage();
            return;
        }

        const tempMemo: BoardMemo = {
            id: -Date.now(),
            boardId,
            content: "",
            x,
            y,
            width: 300,
            height: 200,
            color: "yellow",
            isPublic: true,
        };
        setMemos((prev) => [...prev, tempMemo]);
    };

    // 메모 생성을 위한 핸들러
    const handleInsertMemo = async (tempId: number, boardId: number, content: string, x: number, y: number, width: number, height: number, color: string, isPublic: boolean) => {
        const response = await fetch("/api/memos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                boardId, content, x, y, width, height, color, isPublic
            }),
        });

        const data = await response.json();
        if (!data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to edit memos.");
            return;
        }
        setMemos((prev) =>
            prev.map((memo) =>
                memo.id === tempId ? { ...data.memo, isNew: false } : memo
            )
        );
    };

    // 메모 갱신를 위한 핸들러 - 메모 카드 이동, 크기 조절, 내용 변경 시 호출
    const handleUpdateMemo = async (id: number, boardId: number, content: string, x: number, y: number, width: number, height: number, color: string, isPublic: boolean) => {
        const response = await fetch(`/api/memos/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ boardId, content, x, y, width, height, color, isPublic }),
        });
        const data = await response.json();
        if (!data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to edit memos.");
            return;
        }
        setMemos((prev) =>
            prev.map((memo) =>
                memo.id === id ? { ...memo, content, x, y, width, height, color, isPublic } : memo
            )
        );
    };

    // 메모삭제를 위한 핸들러 - DB에 저장되기 전의 임시 메모일 경우 API리퀘스트를 하지 않고 삭제
    const handleDeleteMemo = async (id: number) => {
        if (id < 0) {
            setMemos((prev) =>
                prev.filter((memo) => memo.id !== id));
            return;
        }

        const response = await fetch(`/api/memos/${id}`, {
            method: "DELETE",
        });
        const data = await response.json();
        if (!data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to edit memos.");
            return;
        }
        setMemos((prev) => prev.filter((memo) => memo.id !== id));
    };

    return {
        memos,
        setMemos,
        handleCreateTempMemo,
        handleInsertMemo,
        handleUpdateMemo,
        handleDeleteMemo,
    };
}
