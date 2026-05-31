import { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { DraggableData, RndDragEvent, RndResizeCallback } from "react-rnd";

export interface MemoCardMemo {
    id: number;
    boardId: number;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    isPublic: boolean;
}

type UseMemoCardOptions = {
    memo: MemoCardMemo;
    zoom: number;
    canEdit: boolean;
    isFocused: boolean;
    onFocus: () => void;
    onFocusClear: () => void;
    onPermissionDenied: () => void;
    onInsert: (
        tempId: number,
        boardId: number,
        content: string,
        x: number,
        y: number,
        width: number,
        height: number,
        color: string,
        isPublic: boolean
    ) => void;
    onUpdate: (
        id: number,
        boardId: number,
        content: string,
        x: number,
        y: number,
        width: number,
        height: number,
        color: string,
        isPublic: boolean
    ) => void;
    onDelete: (id: number) => void;
};

export function useMemoCard({
    memo,
    zoom,
    canEdit,
    isFocused,
    onFocus,
    onFocusClear,
    onPermissionDenied,
    onInsert,
    onUpdate,
    onDelete,
}: UseMemoCardOptions) {
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [dragHandlePressed, setDragHandlePressed] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

    const menuRef = useRef<HTMLDivElement | null>(null);
    const memoFocusRef = useRef<HTMLDivElement | null>(null);
    const lastMemoTapRef = useRef(0);
    const outsidePressStartRef = useRef<{ x: number; y: number } | null>(null);
    const longPressRef = useRef<number | null>(null);

    const [memoState, setMemoState] = useState({
        x: memo.x,
        y: memo.y,
        width: memo.width ?? 300,
        height: memo.height ?? 200,
    });

    const [memoContent, setMemoContent] = useState(memo.content);

    const insertMemo = useCallback(() => {
        onInsert(
            memo.id,
            memo.boardId,
            memoContent,
            Math.round(memoState.x),
            Math.round(memoState.y),
            Math.round(memoState.width),
            Math.round(memoState.height),
            memo.color,
            memo.isPublic
        );
    }, [
        memo.id,
        memo.boardId,
        memoContent,
        memoState.x,
        memoState.y,
        memoState.width,
        memoState.height,
        memo.color,
        memo.isPublic,
        onInsert,
    ]);

    const updateMemo = useCallback(() => {
        onUpdate(
            memo.id,
            memo.boardId,
            memoContent,
            Math.round(memoState.x),
            Math.round(memoState.y),
            Math.round(memoState.width),
            Math.round(memoState.height),
            memo.color,
            memo.isPublic
        );
    }, [
        memo.id,
        memo.boardId,
        memoContent,
        memoState.x,
        memoState.y,
        memoState.width,
        memoState.height,
        memo.color,
        memo.isPublic,
        onUpdate,
    ]);

    const saveMemo = useCallback(() => {
        if (memo.id < 0) {
            insertMemo();
            return;
        }

        updateMemo();
    }, [insertMemo, memo.id, updateMemo]);

    const isTouchDevice = () =>
        typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    const getBoardPoint = (clientX: number, clientY: number) => {
        const board = document.querySelector(".kyu-board");
        const boardRect = board?.getBoundingClientRect();

        return {
            x: boardRect ? (clientX - boardRect.left) / zoom : clientX,
            y: boardRect ? (clientY - boardRect.top) / zoom : clientY,
        };
    };

    const editMemo = useCallback(() => {
        if (!canEdit) {
            onPermissionDenied();
            return;
        }

        setIsEditing(true);
        onFocus();

        window.setTimeout(() => {
            memoFocusRef.current?.focus();
        }, 0);
    }, [canEdit, onFocus, onPermissionDenied]);

    const handleDoubleTap = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "touch") {
            return;
        }

        const currentTime = event.timeStamp;
        const isDoubleTap = currentTime - lastMemoTapRef.current < 300;
        lastMemoTapRef.current = currentTime;

        if (isDoubleTap) {
            event.preventDefault();
            editMemo();
        }
    };

    useEffect(() => {
        const handlePressOutsideMenu = (event: PointerEvent) => {
            const target = event.target as Node;
            const isPressInsideMenu = menuRef.current?.contains(target);

            if (!isPressInsideMenu) {
                setContextMenuOpen(false);
            }
        };

        const handlePressOutside = (event: PointerEvent) => {
            const target = event.target as Node;
            const targetElement = target instanceof Element ? target : null;

            const isPressInsideMenu = menuRef.current?.contains(target);
            const isPressInsideBoardToolBar = targetElement?.closest(".board-toolbar");
            const isPressInsideMemo = targetElement?.closest(`.memo-rnd-${memo.id}`);
            const isPressInsideBoard = targetElement?.closest(".kyu-board");
            const isPressInsideEmptyBoard = Boolean(
                isPressInsideBoard &&
                !isPressInsideMemo &&
                !isPressInsideMenu &&
                !isPressInsideBoardToolBar
            );

            if (isEditing && isPressInsideEmptyBoard) {
                saveMemo();
                setIsEditing(false);
                return;
            }

            if (isPressInsideBoardToolBar || isPressInsideMenu) {
                return;
            }

            if (isPressInsideEmptyBoard && isFocused) {
                onFocusClear();
            }

            outsidePressStartRef.current = null;
        };

        const clearOutsidePressStart = () => {
            outsidePressStartRef.current = null;
        };

        document.addEventListener("pointerdown", handlePressOutsideMenu);
        document.addEventListener("pointerup", handlePressOutside);
        document.addEventListener("pointercancel", clearOutsidePressStart);

        return () => {
            document.removeEventListener("pointerdown", handlePressOutsideMenu);
            document.removeEventListener("pointerup", handlePressOutside);
            document.removeEventListener("pointercancel", clearOutsidePressStart);
        };
    }, [isEditing, isFocused, memo.id, saveMemo, onFocusClear]);

    const handleMemoPress = (event: ReactMouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        onFocus();
    };

    const handleContextMenu = (event: ReactMouseEvent<HTMLElement>) => {
        event.preventDefault();

        if (!canEdit) {
            onPermissionDenied();
            return;
        }

        if (isTouchDevice()) {
            return;
        }

        const { x, y } = getBoardPoint(event.clientX, event.clientY);
        setContextMenuPosition({ x, y });
        setContextMenuOpen(true);
    };

    const handleContextMenuTouch = (event: ReactPointerEvent<HTMLElement>) => {
        if (!canEdit) {
            onPermissionDenied();
            return;
        }

        if (event.pointerType !== "touch") {
            return;
        }

        const { x, y } = getBoardPoint(event.clientX, event.clientY);

        longPressRef.current = window.setTimeout(() => {
            setContextMenuPosition({ x, y });
            setContextMenuOpen(true);
        }, 600);
    };

    const clearLongPress = () => {
        if (longPressRef.current) {
            clearTimeout(longPressRef.current);
            longPressRef.current = null;
        }
    };

    const handleDragStop = (_event: RndDragEvent, data: DraggableData) => {
        setMemoState((prev) => ({ ...prev, x: data.x, y: data.y }));
    };

    const handleResizeStart = () => {
        setIsResizing(true);
    };

    const handleResizeStop: RndResizeCallback = (_event, _direction, ref, _delta, position) => {
        setIsResizing(false);
        setMemoState({
            x: position.x,
            y: position.y,
            width: ref.offsetWidth,
            height: ref.offsetHeight,
        });
    };

    const openDeleteDialog = () => {
        setContextMenuOpen(false);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        onDelete(memo.id);
        setDeleteDialogOpen(false);
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
    };

    return {
        contextMenuOpen,
        contextMenuPosition,
        menuRef,
        isEditing,
        memoFocusRef,
        memoState,
        memoContent,
        setMemoContent,
        deleteDialogOpen,
        dragHandlePressed,
        setDragHandlePressed,
        isResizing,
        editMemo,
        handleDoubleTap,
        handleMemoPress,
        handleContextMenu,
        handleContextMenuTouch,
        clearLongPress,
        handleDragStop,
        handleResizeStart,
        handleResizeStop,
        openDeleteDialog,
        confirmDelete,
        closeDeleteDialog,
    };
}