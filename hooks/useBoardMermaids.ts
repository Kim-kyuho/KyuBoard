import { RefObject, useState } from "react";

export type BoardMermaid = {
    id: number;
    boardId: number;
    source: string;
    x: number;
    y: number;
    width: number;
    height: number;
};

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
            width: 480,
            height: 360,
        };

        setMermaids((prev) => [...prev, tempMermaid]);
    };

    const handleInsertMermaid = async (
        tempId: number,
        boardId: number,
        source: string,
        x: number,
        y: number,
        width: number,
        height: number,
    ) => {
        const response = await fetch("/api/mermaids", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ boardId, source, x, y, width, height }),
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to edit mermaids.");
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
                        width: data.mermaid.width,
                        height: data.mermaid.height,
                    }
                    : mermaid
            )
        );
    };

    const handleUpdateMermaid = async (
        id: number,
        boardId: number,
        source: string,
        x: number,
        y: number,
        width: number,
        height: number,
    ) => {
        const response = await fetch(`/api/mermaids/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ boardId, source, x, y, width, height }),
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to edit mermaids.");
            return;
        }

        setMermaids((prev) =>
            prev.map((mermaid) =>
                mermaid.id === id
                    ? { ...mermaid, boardId, source, x, y, width, height }
                    : mermaid
            )
        );
    };

    const handleDeleteMermaid = async (id: number) => {
        if (id < 0) {
            setMermaids((prev) => prev.filter((mermaid) => mermaid.id !== id));
            return;
        }

        const response = await fetch(`/api/mermaids/${id}`, {
            method: "DELETE",
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to delete mermaids.");
            return;
        }

        setMermaids((prev) => prev.filter((mermaid) => mermaid.id !== id));
    };

    return {
        mermaids,
        handleCreateTempMermaid,
        handleInsertMermaid,
        handleUpdateMermaid,
        handleDeleteMermaid,
    };
}
