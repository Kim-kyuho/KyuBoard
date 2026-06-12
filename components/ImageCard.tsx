"use client";

import Image from "next/image";
import { Rnd } from "react-rnd";
import { EllipsisVertical } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import ImageActionMenu from "./ImageActionMenu";
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
    } = useImageCard({
        image,
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
                onDragStop={handleDragStop}
                onResizeStop={handleResizeStop}
            >
                <div
                    className="relative h-full w-full"
                    onClick={handleImagePress}
                    onDoubleClick={selectImage}
                    onPointerDown={handleDoubleTap}
                >
                    <div className="relative h-full w-full overflow-hidden rounded-xl bg-white shadow-md">
                        <Image
                            src={image.secureUrl}
                            alt={image.fileName ?? "Uploaded image"}
                            fill
                            draggable={false}
                            sizes={`${Math.round(imageState.width)}px`}
                            className="object-contain"
                        />
                    </div>
                    {isSelected && (
                        <button
                            type="button"
                            aria-label="Image actions"
                            className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-neutral-500 opacity-30 backdrop-blur-sm transition duration-150 hover:bg-white/80 hover:text-neutral-900 hover:opacity-100 hover:shadow-sm active:scale-95"
                            onPointerUp={() => {
                                openImageActionMenu();
                            }}
                        >
                            <EllipsisVertical className="h-8 w-8" />
                        </button>
                    )}
                    {actionMenuOpen && (
                        <ImageActionMenu
                            ref={menuRef}
                            zoom={zoom}
                            onDelete={openDeleteDialog}
                        />
                    )}
                </div>
            </Rnd>

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
