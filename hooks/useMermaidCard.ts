import { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { DraggableData, RndDragEvent, RndResizeCallback } from "react-rnd";

export type MermaidCardMermaid = {
    id: number;
    boardId: number;
    source: string;
    x: number;
    y: number;
    width: number;
    height: number;
};

type UseMermaidCardOptions = {
    mermaid: MermaidCardMermaid;
    canEdit: boolean;
    onPermissionDenied: () => void;
    onUpdate: (
        id: number,
        boardId: number,
        source: string,
        x: number,
        y: number,
        width: number,
        height: number,
    ) => void;
    onInsert: (
        tempId: number,
        boardId: number,
        source: string,
        x: number,
        y: number,
        width: number,
        height: number,
    ) => void;
    onDelete: (id: number) => void;
};

export function useMermaidCard({
    mermaid,
    canEdit,
    onPermissionDenied,
    onInsert,
    onUpdate,
    onDelete,
}: UseMermaidCardOptions) {
    const [isEditing, setIsEditing] = useState(mermaid.id < 0);
    const [source, setSource] = useState(mermaid.source);
    const [cardState, setCardState] = useState({
        x: mermaid.x,
        y: mermaid.y,
        width: mermaid.width,
        height: mermaid.height,
    });
    const [dragHandlePressed, setDragHandlePressed] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const lastMermaidTapRef = useRef(0);
    const sourceRef = useRef(source);
    const cardStateRef = useRef(cardState);

    useEffect(() => {
        sourceRef.current = source;
    }, [source]);

    useEffect(() => {
        cardStateRef.current = cardState;
    }, [cardState]);

    const insertMermaid = useCallback(() => {
        const latestCardState = cardStateRef.current;

        onInsert(
            mermaid.id,
            mermaid.boardId,
            sourceRef.current,
            Math.round(latestCardState.x),
            Math.round(latestCardState.y),
            Math.round(latestCardState.width),
            Math.round(latestCardState.height),
        );
    }, [mermaid.boardId, mermaid.id, onInsert]);

    const updateMermaid = useCallback(() => {
        const latestCardState = cardStateRef.current;

        onUpdate(
            mermaid.id,
            mermaid.boardId,
            sourceRef.current,
            Math.round(latestCardState.x),
            Math.round(latestCardState.y),
            Math.round(latestCardState.width),
            Math.round(latestCardState.height),
        );
    }, [mermaid.boardId, mermaid.id, onUpdate]);

    const saveMermaidDraft = useCallback(() => {
        if (mermaid.id < 0) {
            insertMermaid();
            return;
        }

        updateMermaid();
    }, [insertMermaid, mermaid.id, updateMermaid]);

    const editMermaid = () => {
        if (!canEdit) {
            onPermissionDenied();
            return;
        }

        setIsEditing(true);
    };

    const handleDoubleTap = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "touch") {
            return;
        }

        const currentTime = event.timeStamp;
        const isDoubleTap = currentTime - lastMermaidTapRef.current < 300;
        lastMermaidTapRef.current = currentTime;

        if (isDoubleTap) {
            editMermaid();
        }
    };

    useEffect(() => {
        const handlePressOutside = (event: PointerEvent) => {
            const target = event.target as Node;
            const targetElement = target instanceof Element ? target : null;
            const isPressInsideCard = targetElement?.closest(`.mermaid-rnd-${mermaid.id}`);
            const isPressInsideBoardToolBar = targetElement?.closest(".board-toolbar");

            if (!isEditing || isPressInsideCard || isPressInsideBoardToolBar) {
                return;
            }
            saveMermaidDraft();
            setIsEditing(false);

            
        };

        document.addEventListener("pointerup", handlePressOutside);

        return () => {
            document.removeEventListener("pointerup", handlePressOutside);
        };
    }, [isEditing, saveMermaidDraft, mermaid.id]);

    const handleMermaidPress = (event: ReactMouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
    };

    const handleDragStop = (_event: RndDragEvent, data: DraggableData) => {
        const nextCardState = { ...cardStateRef.current, x: data.x, y: data.y };
        cardStateRef.current = nextCardState;
        setCardState(nextCardState);
    };

    const handleResizeStart = () => {
        setIsResizing(true);
    };

    const handleResizeStop: RndResizeCallback = (_event, _direction, ref, _delta, position) => {
        setIsResizing(false);

        const nextCardState = {
            x: position.x,
            y: position.y,
            width: ref.offsetWidth,
            height: ref.offsetHeight,
        };

        cardStateRef.current = nextCardState;
        setCardState(nextCardState);
    };

    const openDeleteDialog = () => {
        setDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
    };

    const confirmDelete = () => {
        onDelete(mermaid.id);
        setDeleteDialogOpen(false);
    };

    return {
        cardState,
        source,
        setSource,
        isEditing,
        isResizing,
        deleteDialogOpen,
        dragHandlePressed,
        setDragHandlePressed,
        editMermaid,
        handleDoubleTap,
        handleMermaidPress,
        handleDragStop,
        handleResizeStart,
        handleResizeStop,
        openDeleteDialog,
        closeDeleteDialog,
        confirmDelete,
    };
}
