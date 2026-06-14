import {
    MouseEvent as ReactMouseEvent,
    PointerEvent as ReactPointerEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
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
    const [actionMenuOpen, setActionMenuOpen] = useState(false);

    const menuRef = useRef<HTMLDivElement | null>(null);
    const lastImageTapRef = useRef(0);
    const imageStateRef = useRef(imageState);
    
    const saveImageDraft = useCallback(() => {
        if (image.imageId < 0) {
            if (!image.file) {
                return;
            }

            const latestImageState = imageStateRef.current;

            onInsert(
                image.imageId,
                image.file,
                image.boardId,
                Math.round(latestImageState.x),
                Math.round(latestImageState.y),
                Math.round(latestImageState.width),
                Math.round(latestImageState.height),
            );
            return;
        }

        const latestImageState = imageStateRef.current;

        onUpdate(
            image.imageId,
            image.boardId,
            image.publicId,
            image.secureUrl,
            image.fileName,
            Math.round(latestImageState.x),
            Math.round(latestImageState.y),
            Math.round(latestImageState.width),
            Math.round(latestImageState.height),
        );
    }, [
        image.boardId,
        image.file,
        image.fileName,
        image.imageId,
        image.publicId,
        image.secureUrl,
        onInsert,
        onUpdate,
    ]);

    const selectImage = () => {
        if (!canEdit) {
            onPermissionDenied();
            return;
        }

        onSelect();
    };

    const handleDoubleTap = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "touch") {
            return;
        }

        const currentTime = event.timeStamp;
        const isDoubleTap = currentTime - lastImageTapRef.current < 300;
        lastImageTapRef.current = currentTime;

        if (isDoubleTap) {
            // event.preventDefault();
            selectImage();
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
            const isPressInsideImage = targetElement?.closest(`.image-rnd-${image.imageId}`);

            if (isPressInsideBoardToolBar || isPressInsideMenu) {
                return;
            }

            if (isSelected && !isPressInsideImage && !isPressInsideMenu) {
                window.setTimeout(() => {
                    saveImageDraft();
                    onSelectClear();
                    setActionMenuOpen(false);
                }, 0);
                return;
            }
        };

        document.addEventListener("pointerdown", handlePressOutsideMenu);
        document.addEventListener("pointerup", handlePressOutside);

        return () => {
            document.removeEventListener("pointerdown", handlePressOutsideMenu);
            document.removeEventListener("pointerup", handlePressOutside);
        };
    }, [image.imageId, isSelected, onSelectClear, saveImageDraft]);

    const handleImagePress = (event: ReactMouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
    };

    const openImageActionMenu = () => {
        if (!canEdit) {
            onPermissionDenied();
            return;
        }

        setActionMenuOpen((prev) => !prev);
    };

    const handleDragStop = (_event: RndDragEvent, data: DraggableData) => {
        const nextImageState = { ...imageStateRef.current, x: data.x, y: data.y };
        imageStateRef.current = nextImageState;
        setImageState(nextImageState);
    };

    const handleResizeStop: RndResizeCallback = (_event, _direction, ref, _delta, position) => {
        const nextImageState = {
            x: position.x,
            y: position.y,
            width: ref.offsetWidth,
            height: ref.offsetHeight,
        };
        imageStateRef.current = nextImageState;
        setImageState(nextImageState);
    };

    const openDeleteDialog = () => {
        setActionMenuOpen(false);
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
        actionMenuOpen,
        menuRef,
        selectImage,
        handleDoubleTap,
        handleImagePress,
        openImageActionMenu,
        handleDragStop,
        handleResizeStop,
        openDeleteDialog,
        confirmDelete,
        closeDeleteDialog,
    };
}
