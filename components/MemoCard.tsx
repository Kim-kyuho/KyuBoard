import { Rnd } from "react-rnd";
import ContextMenu from "./ContextMenu";
import ConfirmDialog from "@/components/ConfrimDialog";
import MemoEditor from "./MemoEditor";
import { MemoCardMemo, useMemoCard } from "@/hooks/useMemoCard";

type MemoCardProps = {
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

// 메모 카드 컴포넌트
export default function MemoCard(props: MemoCardProps) {
    const {
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
    } = props;
    const {
        contextMenuOpen,
        contextMenuPosition,
        menuRef,
        isEditing,
        memoFocusRef,
        memoState,
        memoContent,
        setMemoContent,
        saveDialogOpen,
        deleteDialogOpen,
        cancelDialogOpen,
        dragHandlePressed,
        setDragHandlePressed,
        isResizing,
        editMemo,
        handleDoubleTap,
        handleMemoClick,
        handleContextMenu,
        handleLongPressStart,
        clearLongPress,
        handleDragStop,
        handleResizeStart,
        handleResizeStop,
        openDeleteDialog,
        confirmSave,
        cancelSave,
        confirmCancel,
        closeCancelDialog,
        confirmDelete,
        closeDeleteDialog,
    } = useMemoCard({
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
    });

    return (
        <>
            <Rnd 
                className={`memo-rnd-${memo.id} select-none rounded-xl ${isFocused ? "ring-2 ring-indigo-700 ring-offset-2" : ""}`}
                style={{
                    WebkitTouchCallout: "none",
                    WebkitUserSelect: isEditing ? "text" : "none",
                    userSelect: isEditing ? "text" : "none",
                    touchAction: isEditing ? "auto" : "none",
                    cursor: isEditing ? "text" : "default",
                }}
                default={{
                    x: memo.x,
                    y: memo.y,
                    width: memo.width ?? 300,
                    height: memo.height ?? 200,
                }}
                position={{
                    x: memoState.x,
                    y: memoState.y,
                }}
                size={{
                    width: memoState.width,
                    height: memoState.height,
                }}
                bounds="parent"
                scale={zoom}
                // 메모 하단의 드래그 핸들 영역에서만 드래그 가능
                dragHandleClassName="memo-drag-handle"
                // 텍스트가 활성화되어 있고 메모 수정 권한이 있을 때만 드래그 가능
                disableDragging={!isEditing || !canEdit}
                // 텍스트가 활성화되어 있을 때만 크기 조절 가능
                enableResizing={isEditing}
                /* 마우스 우클릭 이벤트 - 클릭한 좌표에 컨텍스트 메뉴를 표시 */
                onContextMenu={handleContextMenu}
                /* 모바일에서 길게 누름 이벤트 - 터치한 좌표에 컨텍스트 메뉴를 표시 */      
                onPointerDown={handleLongPressStart}
                onPointerUp={clearLongPress}
                onPointerMove={clearLongPress}
                // 메모 카드 이동 완료 시 좌표 저장
                onDragStop={handleDragStop}
                // 메모 카드 크기 조절 시작 시 피드백 표시
                onResizeStart={handleResizeStart}
                // 메모 카드 크기 조절 완료 시 사이즈 정보 저장
                onResizeStop={handleResizeStop}
            >   
                {/* 메모 카드 내용 영역 - 공개 메모는 내용 표시, 비공개 메모는 "비공개 메모입니다." 표시 */}
                <div
                    className="relative h-full w-full"
                    onClick={handleMemoClick}
                >
                    {memo.isPublic ? (
                        // 편집 모드에서는 텍스트 영역, 일반 모드에서는 div로 내용을 표시
                        isEditing ? (
                            <div
                                className="h-full w-full rounded-xl p-4 shadow-md text-neutral-900"
                                ref={memoFocusRef}
                                tabIndex={-1}
                                style={{
                                    backgroundColor: "#fffadc",
                                    cursor: "text",
                                }}
                            >
                            <MemoEditor
                                content={memoContent}
                                onChange={setMemoContent}
                            />
                            </div>
                        ) : (
                            <div
                                className="h-full w-full rounded-xl p-4 shadow-md text-neutral-900"
                                style={{
                                    backgroundColor: "#fffadc",
                                    WebkitTouchCallout: "none",
                                    WebkitUserSelect: "none",
                                    userSelect: "none",
                                    touchAction: "none",
                                }}
                                onDoubleClick={editMemo}
                                onPointerDown={handleDoubleTap}
                            >
                                <div
                                    className="memo-editor-content"
                                    dangerouslySetInnerHTML={{ __html: memoContent }}
                                />
                            </div>
                        )
                    ) : (
                        <div
                            className="h-full w-full rounded-xl p-4 shadow-md text-neutral-900"
                            style={{
                                backgroundColor: "#fffadc",
                                WebkitTouchCallout: "none",
                                WebkitUserSelect: "none",
                                userSelect: "none",
                                touchAction: "none",
                            }}
                        >
                            This memo is private.
                        </div>
                    )}
                    {/* 메모 이동 핸들: 수정 중일 때 이 바를 잡고 드래그하면 메모를 이동 */}
                    {isEditing && (
                        <div
                            className="memo-drag-handle absolute bottom-2 left-1/2 z-10 flex h-5 w-24 -translate-x-1/2 cursor-grab items-center justify-center rounded-full active:cursor-grabbing"
                            onPointerDown={() => setDragHandlePressed(true)}
                            onPointerUp={() => setDragHandlePressed(false)}
                            onPointerCancel={() => setDragHandlePressed(false)}
                            onPointerLeave={() => setDragHandlePressed(false)}
                        >
                            <div className={`h-1.5 w-24 rounded-full transition duration-150 ${dragHandlePressed ? "bg-black/70" : "bg-black/25"}`} />
                        </div>
                    )}
                    {/* 메모 리사이즈 피드백 */}
                    {isResizing && (
                        <div className="pointer-events-none absolute inset-0 z-20 animate-pulse rounded-xl border-2 border-dashed border-pink-500" />
                    )}
                </div>
            </Rnd>
        
            {/* 컨텍스트 메뉴: Edit, Delete 버튼이 있는 메뉴 - 메모 카드에서 우클릭 시 열림 */}
            {contextMenuOpen && (
                <ContextMenu
                    ref={menuRef}
                    contextMenuPosition={contextMenuPosition}
                    onDelete={openDeleteDialog}
                />
            )}
            {/* 저장 확인 다이얼로그 - 메모 카드 영역 외부 클릭 시 열림, Yes 클릭 시 메모 저장, No 클릭 시 페이지 새로고침하여 변경사항 무시 */}
            {saveDialogOpen && (
                <ConfirmDialog 
                    message="Save changes?"
                    onConfirm={confirmSave}
                    onCancel={cancelSave}
                />
            )}
            {/* 수정 취소 확인 다이얼로그 - Yes 클릭 시 메모 수정 취소 */}
            {cancelDialogOpen && (
                <ConfirmDialog
                    message="Discard changes?"
                    onConfirm={confirmCancel}
                    onCancel={closeCancelDialog}
                />
            )}
            {/* 저장 확인 다이얼로그와 삭제 확인 다이얼로그 - 각각의 다이얼로그에서 Yes 클릭 시 메모 저장 또는 삭제, No 클릭 시 다이얼로그 닫기 */}
            {deleteDialogOpen && (
                <ConfirmDialog
                    message="Delete this memo?"
                    onConfirm={confirmDelete}
                    onCancel={closeDeleteDialog}
                />
            )}
        </>
    );
}
