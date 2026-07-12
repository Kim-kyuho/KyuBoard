"use client";

import Image from "next/image";
import { Rnd } from "react-rnd";
import { EllipsisVertical } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import ImageActionMenu from "./ImageActionMenu";
import { ImageCardData, useImageCard } from "@/hooks/useImageCard";
import { ACTIVE_CARD_Z } from "@/lib/zIndex";

type ImageCardProps = {
    image: ImageCardData;
    zoom: number;
    canEdit: boolean;
    isEditing: boolean;
    onEditing: () => void;
    onEditingClear: () => void;
    onPermissionDenied: () => void;
    onInsert: (
        tempId: number,
        file: File,
        boardId: number,
        x: number,
        y: number,
        z: number,
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
        z: number,
        width: number,
        height: number,
    ) => void;
    onDelete: (
        imageId: number,
        publicId: string,
    ) => void;
    onBringToFront: () => void;
    onSendToBack: () => void;
};

// 이미지 카드 컴포넌트
export default function ImageCard(props: ImageCardProps) {
    const {
        image,
        zoom,
        canEdit,
        isEditing,
        onEditing,
        onEditingClear,
        onPermissionDenied,
        onInsert,
        onUpdate,
        onDelete,
        onBringToFront,
        onSendToBack,
    } = props;

    const {
        imageState,
        deleteDialogOpen,
        actionMenuOpen,
        menuRef,
        editImage,
        handleDoubleTap,
        handleImagePress,
        openImageActionMenu,
        closeActionMenu,
        handleDragStop,
        handleResizeStop,
        openDeleteDialog,
        confirmDelete,
        closeDeleteDialog,
    } = useImageCard({
        image,
        canEdit,
        isEditing,
        onEditing,
        onEditingClear,
        onPermissionDenied,
        onInsert,
        onUpdate,
        onDelete,
    });

    return (
        <>
            <Rnd
                data-editing={isEditing}
                // imageCard컴포넌트의 드래그 이벤트와 충돌을 막기 위한 cancel처리
                cancel=".image-action-menu"
                className={`image-rnd-${image.imageId} select-none ${isEditing ? "card-editing" : ""}`}
                style={{
                    zIndex: isEditing ? ACTIVE_CARD_Z : image.z,
                    WebkitTouchCallout: "none",
                    WebkitUserSelect: "none",
                    userSelect: "none",
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
                disableDragging={!isEditing}
                enableResizing={isEditing}
                onDragStop={handleDragStop}
                onResizeStop={handleResizeStop}
            >
                <div
                    className="relative h-full w-full rounded-xl bg-white"
                    onClick={handleImagePress}
                    onDoubleClick={editImage}
                    onPointerDown={handleDoubleTap}
                >
                    {isEditing && (
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
                            onBringToFront={() => {
                                onBringToFront();
                                closeActionMenu();
                            }}
                            onSendToBack={() => {
                                onSendToBack();
                                closeActionMenu();
                            }}
                            onDelete={openDeleteDialog}
                        />
                    )}
                    <div className="relative h-full w-full overflow-hidden rounded-xl">
                        <Image
                            src={image.secureUrl}
                            alt={image.fileName ?? "Uploaded image"}
                            fill
                            draggable={false}
                            sizes={`${Math.round(imageState.width)}px`}
                            className="object-contain"
                        />
                    </div>
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
