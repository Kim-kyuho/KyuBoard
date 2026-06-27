import { RefObject, useState } from "react";
import { jsonRequestInit, requestJson, type ApiResponse } from "@/lib/api/client";

export type BoardMermaid = {
    id: number;
    boardId: number;
    source: string;
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
};

export type BoardMermaidPayload = Omit<BoardMermaid, "id">;

export type InsertBoardMermaidInput = {
    tempId: number;
    mermaid: BoardMermaidPayload;
};

export type UpdateBoardMermaidInput = BoardMermaid;

type UseBoardMermaidsOptions = {
    initialMermaids: BoardMermaid[];
    boardId: number;
    boardZoom: number;
    canEditMemos: boolean;
    locationRef: RefObject<HTMLDivElement | null>;
    showPermissionMessage: () => void;
    setPermissionMessage: (message: string) => void;
};

type BoardPoint = {
    x: number;
    y: number;
};

const defaultMermaidSource = `flowchart LR
    A["Start"] --> B["Mermaid Card"]`;

export function useBoardMermaids({
    initialMermaids,
    boardId,
    boardZoom,
    canEditMemos,
    locationRef,
    showPermissionMessage,
    setPermissionMessage,
}: UseBoardMermaidsOptions) {
    const [mermaids, setMermaids] = useState<BoardMermaid[]>(initialMermaids);

    const getMermaidAutoLocation = (): BoardPoint => {
        const locationElement = locationRef.current;
        if (!locationElement) {
            return { x: 0, y: 0 };
        }

        return {
            x: Math.max(0, (locationElement.scrollLeft + locationElement.clientWidth / 2) / boardZoom - 240),
            y: Math.max(0, (locationElement.scrollTop + locationElement.clientHeight / 2) / boardZoom - 180),
        };
    };

    const handleCreateTempMermaid = () => {
        if (!canEditMemos) {
            showPermissionMessage();
            return;
        }

        const { x, y } = getMermaidAutoLocation();
        const tempMermaid: BoardMermaid = {
            id: -Date.now(),
            boardId,
            source: defaultMermaidSource,
            x: Math.round(x),
            y: Math.round(y),
            z: 1,
            width: 480,
            height: 360,
        };

        setMermaids((prev) => [...prev, tempMermaid]);
    };

    const handleInsertMermaid = async ({ tempId, mermaid }: InsertBoardMermaidInput) => {
        const data = await requestJson<ApiResponse & { mermaid: { mermaidId: number } & BoardMermaidPayload }>(
            "/api/mermaids",
            jsonRequestInit("POST", mermaid),
            {
                fallbackMessage: "You do not have permission to edit mermaids.",
                setErrorMessage: setPermissionMessage,
            }
        );

        if (!data) {
            return;
        }

        setMermaids((prev) =>
            prev.map((mermaid) =>
                mermaid.id === tempId
                    ? {
                        id: data.mermaid.mermaidId,
                        boardId: data.mermaid.boardId,
                        source: data.mermaid.source,
                        x: data.mermaid.x,
                        y: data.mermaid.y,
                        z: data.mermaid.z,
                        width: data.mermaid.width,
                        height: data.mermaid.height,
                    }
                    : mermaid
            )
        );
    };

    const handleUpdateMermaid = async (mermaid: UpdateBoardMermaidInput) => {
        const { id, ...payload } = mermaid;
        const data = await requestJson<ApiResponse>(
            `/api/mermaids/${id}`,
            jsonRequestInit("PATCH", payload),
            {
                fallbackMessage: "You do not have permission to edit mermaids.",
                setErrorMessage: setPermissionMessage,
            }
        );

        if (!data) {
            return;
        }

        setMermaids((prev) =>
            prev.map((mermaid) =>
                mermaid.id === id
                    ? { ...mermaid, ...payload }
                    : mermaid
            )
        );
    };

    const handleDeleteMermaid = async (id: number) => {
        if (id < 0) {
            setMermaids((prev) => prev.filter((mermaid) => mermaid.id !== id));
            return;
        }

        const data = await requestJson<ApiResponse>(
            `/api/mermaids/${id}`,
            { method: "DELETE" },
            {
                fallbackMessage: "You do not have permission to delete mermaids.",
                setErrorMessage: setPermissionMessage,
            }
        );

        if (!data) {
            return;
        }

        setMermaids((prev) => prev.filter((mermaid) => mermaid.id !== id));
    };

    return {
        mermaids,
        setMermaids,
        handleCreateTempMermaid,
        handleInsertMermaid,
        handleUpdateMermaid,
        handleDeleteMermaid,
    };
}
