"use client";

import Image from "next/image";
import { Rnd } from "react-rnd";
import ConfirmDialog from "@/components/ConfrimDialog";
import ImageContextMenu from "./ImageContextMenu";
import { ImageCardImage, useImageCard } from "@/hooks/useImageCard";

type ImageCardProps = {
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

// 이미지 카드 컴포넌트
export default function ImageCard(props: ImageCardProps) {
    const {
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
    } = props;

    const {
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
    } = useImageCard({
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
    });

    return (
        <>
            <Rnd
                className={`image-rnd-${image.imageId} select-none ${
                    isSelected ? "rounded-xl border-2 border-dashed border-pink-500" : ""
                }`}
                style={{
                    WebkitTouchCallout: "none",
                    WebkitUserSelect: "none",
                    userSelect: "none",
                    touchAction: "none",
                }}
                default={{
                    x: image.x,
                    y: image.y,
                    width: image.width,
                    height: image.height,
                }}
                position={{
                    x: imageState.x,
                    y: imageState.y,
                }}
                size={{
                    width: imageState.width,
                    height: imageState.height,
                }}
                bounds="parent"
                scale={zoom}
                disableDragging={!isSelected}
                enableResizing={isSelected}
                onContextMenu={handleContextMenu}
                onPointerDown={handleLongPressStart}
                onPointerUp={clearLongPress}
                onPointerMove={clearLongPress}
                onDragStop={handleDragStop}
                onResizeStop={handleResizeStop}
            >
                <div
                    className="relative h-full w-full overflow-hidden rounded-xl bg-white shadow-md"
                    onClick={handleImagePress}
                    onDoubleClick={selectImage}
                    onPointerDown={handleDoubleTap}
                >
                    <Image
                        src={image.secureUrl}
                        alt={image.fileName ?? "Uploaded image"}
                        fill
                        draggable={false}
                        sizes={`${Math.round(imageState.width)}px`}
                        className="object-contain"
                    />
                </div>
            </Rnd>

            {contextMenuOpen && (
                <ImageContextMenu
                    ref={menuRef}
                    contextMenuPosition={contextMenuPosition}
                    onDelete={openDeleteDialog}
                />
            )}

            {deleteDialogOpen && (
                <ConfirmDialog
                    message="Delete this image?"
                    onConfirm={confirmDelete}
                    onCancel={closeDeleteDialog}
                />
            )}
        </>
    );
}
