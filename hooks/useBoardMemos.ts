import { useState } from "react";
import { jsonRequestInit, requestJson, type ApiResponse } from "@/lib/api/client";

export type BoardMemo = {
    id: number;
    boardId: number;
    content: string;
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
    color: string;
    isPublic: boolean;
};

export type BoardMemoPayload = Omit<BoardMemo, "id">;

export type InsertBoardMemoInput = {
    tempId: number;
    memo: BoardMemoPayload;
};

export type UpdateBoardMemoInput = BoardMemo;

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
            z: 1,
            width: 300,
            height: 200,
            color: "#fffadc",
            isPublic: true,
        };
        setMemos((prev) => [...prev, tempMemo]);
    };

    const handleInsertMemo = async ({ tempId, memo }: InsertBoardMemoInput) => {
        const data = await requestJson<ApiResponse & { memo: BoardMemo }>(
            "/api/memos",
            jsonRequestInit("POST", memo),
            {
                fallbackMessage: "You do not have permission to edit memos.",
                setErrorMessage: setPermissionMessage,
            }
        );

        if (!data) {
            return;
        }

        setMemos((prev) =>
            prev.map((memo) =>
                memo.id === tempId ? data.memo : memo
            )
        );
    };

    const handleUpdateMemo = async (memo: UpdateBoardMemoInput) => {
        const { id, ...payload } = memo;
        const data = await requestJson<ApiResponse>(
            `/api/memos/${id}`,
            jsonRequestInit("PATCH", payload),
            {
                fallbackMessage: "You do not have permission to edit memos.",
                setErrorMessage: setPermissionMessage,
            }
        );

        if (!data) {
            return;
        }

        setMemos((prev) =>
            prev.map((memo) =>
                memo.id === id ? { ...memo, ...payload } : memo
            )
        );
    };

    const handleDeleteMemo = async (id: number) => {
        if (id < 0) {
            setMemos((prev) =>
                prev.filter((memo) => memo.id !== id));
            return;
        }

        const data = await requestJson<ApiResponse>(
            `/api/memos/${id}`,
            { method: "DELETE" },
            {
                fallbackMessage: "You do not have permission to edit memos.",
                setErrorMessage: setPermissionMessage,
            }
        );

        if (!data) {
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
