"use client";

import { Rnd } from "react-rnd";
import ConfirmDialog from "@/components/ConfrimDialog";
import ContextMenu from "./ContextMenu";
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
    // 이미지 카드의 상태와 핸들러를 관리하는 커스텀 훅을 사용하여 필요한 상태와 이벤트 핸들러들을 가져옴
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
                className={`image-rnd-${image.imageId} select-none ${isSelected ? "rounded-xl border-2 border-dashed border-pink-500" : ""}`}
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
                /* 마우스 우클릭 이벤트 - 클릭한 좌표에 컨텍스트 메뉴를 표시 */
                onContextMenu={handleContextMenu}
                /* 모바일에서 길게 누름 이벤트 - 터치한 좌표에 컨텍스트 메뉴를 표시 */
                onPointerDown={handleLongPressStart}
                onPointerUp={clearLongPress}
                onPointerMove={clearLongPress}
                // 이미지 카드 이동 완료 시 좌표만 임시 저장
                onDragStop={handleDragStop}
                // 이미지 카드 크기 조절 완료 시 사이즈 정보만 임시 저장
                onResizeStop={handleResizeStop}
            >
                <div
                    className="h-full w-full overflow-hidden rounded-xl bg-white shadow-md"
                    onClick={handleImagePress}
                    onDoubleClick={selectImage}
                    onPointerDown={handleDoubleTap}
                >
                    <img
                        src={image.secureUrl}
                        alt={image.fileName ?? "Uploaded image"}
                        draggable={false}
                        className="h-full w-full object-contain"
                    />
                </div>
            </Rnd>

            {/* 컨텍스트 메뉴: Delete 버튼이 있는 메뉴 - 이미지 카드에서 우클릭 시 열림 */}
            {contextMenuOpen && (
                <ContextMenu
                    ref={menuRef}
                    contextMenuPosition={contextMenuPosition}
                    onDelete={openDeleteDialog}
                />
            )}

            {/* 삭제 확인 다이얼로그 - Yes 클릭 시 이미지 삭제 */}
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
