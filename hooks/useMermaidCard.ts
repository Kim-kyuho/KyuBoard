import { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { DraggableData, RndDragEvent, RndResizeCallback } from "react-rnd";
import type { InsertBoardMermaidInput, UpdateBoardMermaidInput } from "@/hooks/useBoardMermaids";

export type MermaidCardMermaid = {
    id: number;
    boardId: number;
    source: string;
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
};

type UseMermaidCardOptions = {
    mermaid: MermaidCardMermaid;
    canEdit: boolean;
    onPermissionDenied: () => void;
    onUpdate: (input: UpdateBoardMermaidInput) => void;
    onInsert: (input: InsertBoardMermaidInput) => void;
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
    const [actionMenuOpen, setActionMenuOpen] = useState(false);

    const menuRef = useRef<HTMLDivElement | null>(null);
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

        onInsert({
            tempId: mermaid.id,
            mermaid: {
                boardId: mermaid.boardId,
                source: sourceRef.current,
                x: Math.round(latestCardState.x),
                y: Math.round(latestCardState.y),
                z: mermaid.z,
                width: Math.round(latestCardState.width),
                height: Math.round(latestCardState.height),
            },
        });
    }, [mermaid.boardId, mermaid.id, mermaid.z, onInsert]);

    const updateMermaid = useCallback(() => {
        const latestCardState = cardStateRef.current;

        onUpdate({
            id: mermaid.id,
            boardId: mermaid.boardId,
            source: sourceRef.current,
            x: Math.round(latestCardState.x),
            y: Math.round(latestCardState.y),
            z: mermaid.z,
            width: Math.round(latestCardState.width),
            height: Math.round(latestCardState.height),
        });
    }, [mermaid.boardId, mermaid.id, mermaid.z, onUpdate]);

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
        const handlePressOutsideMenu = (event: PointerEvent) => {
            const target = event.target as Node;
            const isPressInsideMenu = menuRef.current?.contains(target);

            if (!isPressInsideMenu) {
                setActionMenuOpen(false);
            }
        };

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

        document.addEventListener("pointerdown", handlePressOutsideMenu);
        document.addEventListener("pointerup", handlePressOutside);

        return () => {
            document.removeEventListener("pointerdown", handlePressOutsideMenu);
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

    const openMermaidActionMenu = () => {
        if (!canEdit) {
            onPermissionDenied();
            return;
        }

        setActionMenuOpen((prev) => !prev);
    };

    const openDeleteDialog = () => {
        setActionMenuOpen(false);
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
        actionMenuOpen,
        cardState,
        source,
        setSource,
        menuRef,
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
        openMermaidActionMenu,
        openDeleteDialog,
        closeDeleteDialog,
        confirmDelete,
    };
}
