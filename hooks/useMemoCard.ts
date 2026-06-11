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
    canEdit,
    isFocused,
    onFocus,
    onFocusClear,
    onPermissionDenied,
    onInsert,
    onUpdate,
    onDelete,
}: UseMemoCardOptions) {
    const [actionMenuOpen, setActionMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [dragHandlePressed, setDragHandlePressed] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const memoFocusRef = useRef<HTMLDivElement | null>(null);
    const lastMemoTapRef = useRef(0);

    const [memoState, setMemoState] = useState({
        x: memo.x,
        y: memo.y,
        width: memo.width ?? 300,
        height: memo.height ?? 200,
    });

    const [memoContent, setMemoContent] = useState(memo.content);
    const [memoColor, setMemoColor] = useState(memo.color);

    const insertMemo = useCallback(() => {
        onInsert(
            memo.id,
            memo.boardId,
            memoContent,
            Math.round(memoState.x),
            Math.round(memoState.y),
            Math.round(memoState.width),
            Math.round(memoState.height),
            memoColor,
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
        memoColor,
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
            memoColor,
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
        memoColor,
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
                setActionMenuOpen(false);
            }
        };

        const handlePressOutside = (event: PointerEvent) => {
            const target = event.target as Node;
            const targetElement = target instanceof Element ? target : null;

            const isPressInsideMenu = menuRef.current?.contains(target);
            const isPressInsideBoardToolBar = targetElement?.closest(".board-toolbar");
            const isPressInsideMemo = targetElement?.closest(`.memo-rnd-${memo.id}`);
            const isPressInsideBoard = targetElement?.closest(".board-scroll-layer");
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

        };

        document.addEventListener("pointerdown", handlePressOutsideMenu);
        document.addEventListener("pointerup", handlePressOutside);

        return () => {
            document.removeEventListener("pointerdown", handlePressOutsideMenu);
            document.removeEventListener("pointerup", handlePressOutside);
        };
    }, [isEditing, isFocused, memo.id, saveMemo, onFocusClear]);

    const handleMemoPress = (event: ReactMouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        onFocus();
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
        setActionMenuOpen(false);
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
        actionMenuOpen,
        setActionMenuOpen,
        memoColor,
        setMemoColor,
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
        handleDragStop,
        handleResizeStart,
        handleResizeStop,
        openDeleteDialog,
        confirmDelete,
        closeDeleteDialog,
    };
}
