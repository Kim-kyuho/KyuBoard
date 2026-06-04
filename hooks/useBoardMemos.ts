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
    const [memos, setMemos] = useState(initialMemos);

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
            color: "#fffadc",
            isPublic: true,
        };
        setMemos((prev) => [...prev, tempMemo]);
    };

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
        if (!response.ok || !data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to edit memos.");
            return;
        }
        setMemos((prev) =>
            prev.map((memo) =>
                memo.id === tempId ? { ...data.memo, isNew: false } : memo
            )
        );
    };

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
