import { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { DraggableData, RndDragEvent, RndResizeCallback } from "react-rnd";

export interface ImageCardImage {
    imageId: number;
    boardId: number;
    publicId: string;
    secureUrl: string;
    fileName: string | null;
    file?: File;
    x: number;
    y: number;
    width: number;
    height: number;
}

type UseImageCardOptions = {
    image: ImageCardImage;
    zoom: number;
    canEdit: boolean;
    isSelected: boolean;
    onSelect: () => void;
    onSelectClear: () => void;
    onPermissionDenied: () => void;
    onInsert: (
        tempId: number,
        file: File,
        boardId: number,
        x: number,
        y: number,
        width: number,
        height: number,
    ) => void;
    onUpdate: (
        imageId: number,
        boardId: number,
        publicId: string,
        secureUrl: string,
        fileName: string | null,
        x: number,
        y: number,
        width: number,
        height: number,
    ) => void;
    onDelete: (
        imageId: number,
        publicId: string,
    ) => void;
};

export function useImageCard({
    image,
    zoom,
    canEdit,
    isSelected,
    onSelect,
    onSelectClear,
    onPermissionDenied,
    onInsert,
    onUpdate,
    onDelete,
}: UseImageCardOptions) {
    const [imageState, setImageState] = useState({
        x: image.x,
        y: image.y,
        width: image.width,
        height: image.height,
    });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement | null>(null);
    const lastImageTapRef = useRef(0);
    const longPressRef = useRef<number | null>(null);
    const contextMenuOpenTimeRef = useRef<number>(0);

    const saveImageDraft = useCallback(() => {
        if (image.imageId < 0) {
            if (!image.file) {
                return;
            }

            onInsert(
                image.imageId,
                image.file,
                image.boardId,
                Math.round(imageState.x),
                Math.round(imageState.y),
                Math.round(imageState.width),
                Math.round(imageState.height),
            );
            return;
        }

        onUpdate(
            image.imageId,
            image.boardId,
            image.publicId,
            image.secureUrl,
            image.fileName,
            Math.round(imageState.x),
            Math.round(imageState.y),
            Math.round(imageState.width),
            Math.round(imageState.height),
        );
    }, [image.boardId, image.file, image.fileName, image.imageId, image.publicId, image.secureUrl, imageState.height, imageState.width, imageState.x, imageState.y, onInsert, onUpdate]);

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

    const selectImage = () => {
        if (!canEdit) {
            onPermissionDenied();
            return;
        }

        onSelect();
    };

    const handleDoubleTap = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "touch") { return; }

        const currentTime = event.timeStamp;
        const isDoubleTap = currentTime - lastImageTapRef.current < 300;
        lastImageTapRef.current = currentTime;

        if (isDoubleTap) {
            event.preventDefault();
            selectImage();
        }
    };

    useEffect(() => {
        const handlePressOutside = (event: PointerEvent) => {
            const target = event.target as Node;
            const targetElement = target instanceof Element ? target : null;
            const isPressInsideMenu = menuRef.current?.contains(target);
            const isPressInsideBoardToolBar = targetElement?.closest(".board-toolbar");
            const isPressInsideConfirmDialog = targetElement?.closest(".confirm-dialog");
            const isPressInsideImage = targetElement?.closest(`.image-rnd-${image.imageId}`);

            if (isPressInsideBoardToolBar || isPressInsideConfirmDialog) {
                return;
            }

            if (!isPressInsideImage && !isPressInsideMenu) {
                if (isSelected) {
                    saveImageDraft();
                    onSelectClear();
                }
                setContextMenuOpen(false);
                return;
            }
        };

        document.addEventListener("pointerup", handlePressOutside);
        return () => {
            document.removeEventListener("pointerup", handlePressOutside);
        };
    }, [image.imageId, isSelected, onSelectClear, saveImageDraft]);

    const handleImagePress = (event: ReactMouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
    };

    const handleContextMenu = (event: ReactMouseEvent<HTMLElement>) => {
        event.preventDefault();
        if (!canEdit) {
            onPermissionDenied();
            return;
        }
        if (isTouchDevice()) { return; }

        const { x, y } = getBoardPoint(event.clientX, event.clientY);
        setContextMenuPosition({ x, y });
        setContextMenuOpen(true);
    };

    const handleLongPressStart = (event: ReactPointerEvent<HTMLElement>) => {
        if (event.pointerType !== "touch") { return; }
        if (!canEdit) { return; }

        const { x, y } = getBoardPoint(event.clientX, event.clientY);
        longPressRef.current = window.setTimeout(() => {
            setContextMenuPosition({ x, y });
            setContextMenuOpen(true);
        }, 600);
    };

    const clearLongPress = () => {
        if (longPressRef.current) {
            window.clearTimeout(longPressRef.current);
            longPressRef.current = null;
        }
    };

    const handleDragStop = (_event: RndDragEvent, data: DraggableData) => {
        setImageState((prev) => ({ ...prev, x: data.x, y: data.y }));
    };

    const handleResizeStop: RndResizeCallback = (_event, _direction, ref, _delta, position) => {
        setImageState({
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
        onDelete(image.imageId, image.publicId);
        setDeleteDialogOpen(false);
        onSelectClear();
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
    };

    return {
        imageState,
        deleteDialogOpen,
        contextMenuOpen,
        contextMenuPosition,
        menuRef,
        selectImage,
        handleDoubleTap,
        handleImagePress,
        handleContextMenu,
        handleLongPressStart,
        clearLongPress,
        handleDragStop,
        handleResizeStop,
        openDeleteDialog,
        confirmDelete,
        closeDeleteDialog,
    };
}
