import { useRef } from "react";
import { Rnd } from "react-rnd";
import { EllipsisVertical } from "lucide-react";
import MemoActionMenu from "./MemoActionMenu";
import ConfirmDialog from "@/components/ConfirmDialog";
import { MemoCardData, useMemoCard } from "@/hooks/useMemoCard";
import { ACTIVE_CARD_Z } from "@/lib/zIndex";
import MemoEditor from "./MemoEditor";
import type { MemoEditorHandle } from "./MemoEditor";

type MemoCardProps = {
    memo: MemoCardData;
    zoom: number;
    canEdit: boolean;
    isEditing: boolean;
    isFocused: boolean;
    onFocus: () => void;
    onFocusClear: () => void;
    onEditing: () => void;
    onEditingClear: () => void;
    onPermissionDenied: () => void;
    onInsert: (
        tempId: number,
        boardId: number,
        content: string,
        x: number,
        y: number,
        z: number,
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
        z: number,
        width: number,
        height: number,
        color: string,
        isPublic: boolean
    ) => void;
    onDelete: (id: number) => void;
    onBringToFront: () => void;
    onSendToBack: () => void;
};

// 메모 카드 컴포넌트
export default function MemoCard(props: MemoCardProps) {
    const {
        memo,
        zoom,
        canEdit,
        isEditing,
        isFocused,
        onFocus,
        onFocusClear,
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
        actionMenuOpen,
        setActionMenuOpen,
        memoColor,
        setMemoColor,
        menuRef,
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
        closeDeleteDialog,
        confirmDelete,
    } = useMemoCard({
        memo,
        canEdit,
        isEditing,
        isFocused,
        onEditing,
        onEditingClear,
        onFocus,
        onFocusClear,
        onPermissionDenied,
        onInsert,
        onUpdate,
        onDelete,
    });

    const memoEditorRef = useRef<MemoEditorHandle>(null);

    return (
        <>
            <Rnd 
                data-editing={isEditing}
                className={`memo-rnd-${memo.id} select-none rounded-xl ${isEditing ? "card-editing" : isFocused ? "memo-focused" : ""}`}
                style={{
                    zIndex: isEditing ? ACTIVE_CARD_Z : memo.z,
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
                dragHandleClassName="memo-drag-handle"
                disableDragging={!isEditing || !canEdit}
                enableResizing={isEditing}
                onDragStop={handleDragStop}
                onResizeStart={handleResizeStart}
                onResizeStop={handleResizeStop}
            >   
                <div
                    className="relative h-full w-full"
                    onClick={handleMemoPress}
                >
                    {memo.isPublic ? (
                        isEditing ? (
                            <div
                                className="relative h-full w-full rounded-xl p-4 shadow-xl text-neutral-900"
                                ref={memoFocusRef}
                                tabIndex={-1}
                                style={{
                                    backgroundColor: memoColor,
                                    cursor: "text",
                                }}
                            >
                                <button
                                    type="button"
                                    className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-neutral-500 opacity-30 backdrop-blur-sm transition duration-150 hover:bg-white/80 hover:text-neutral-900 hover:opacity-100 hover:shadow-sm active:scale-95"
                                    onClick={() => {
                                        setActionMenuOpen((prev) => !prev);
                                    }}
                                >
                                    <EllipsisVertical className="h-8 w-8" />
                                </button>
                                <MemoEditor
                                    ref={memoEditorRef}
                                    content={memoContent}
                                    onChange={setMemoContent}
                                />
                                {actionMenuOpen && (
                                    <MemoActionMenu
                                        ref={menuRef}
                                        zoom={zoom}
                                        isEditing={isEditing}
                                        onChangeColor={(color: string) => {
                                            setMemoColor(color);
                                            setActionMenuOpen(false);
                                        }}
                                        onHeading={(level) => {
                                            memoEditorRef.current?.toggleHeading(level);
                                            setActionMenuOpen(false);
                                        }}
                                        onBold={() => {
                                            memoEditorRef.current?.toggleBold();
                                            setActionMenuOpen(false);
                                        }}
                                        onItalic={() => {
                                            memoEditorRef.current?.toggleItalic();
                                            setActionMenuOpen(false);
                                        }}
                                        onStrike={() => {
                                            memoEditorRef.current?.toggleStrike();
                                            setActionMenuOpen(false);
                                        }}
                                        onHorizontalRule={() => {
                                            memoEditorRef.current?.setHorizontalRule();
                                            setActionMenuOpen(false);
                                        }}
                                        onHighlight={() => {
                                            memoEditorRef.current?.toggleHighlight();
                                            setActionMenuOpen(false);
                                        }}
                                        onCodeBlock={() => {
                                            memoEditorRef.current?.toggleCodeBlock();
                                            setActionMenuOpen(false);
                                        }}
                                        onBlockQuote={() => {
                                            memoEditorRef.current?.toggleBlockQuote();
                                            setActionMenuOpen(false);
                                        }}
                                        onBringToFront={() => {
                                            onBringToFront();
                                            setActionMenuOpen(false);
                                        }}
                                        onSendToBack={() => {
                                            onSendToBack();
                                            setActionMenuOpen(false);
                                        }}
                                        onDelete={openDeleteDialog}   
                                    />
                                )}
                            </div>
                        ) : (
                            <div
                                className="h-full w-full rounded-xl p-4 shadow-md text-neutral-900"
                                style={{
                                    backgroundColor: memoColor,
                                    WebkitTouchCallout: "none",
                                    WebkitUserSelect: "none",
                                    userSelect: "none",
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
                                backgroundColor: memoColor,
                                WebkitTouchCallout: "none",
                                WebkitUserSelect: "none",
                                userSelect: "none",
                            }}
                        >
                            This memo is private.
                        </div>
                    )}
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
                    {isResizing && (
                        <div className="pointer-events-none absolute inset-0 z-20 animate-pulse rounded-xl border-2 border-dashed border-pink-500" />
                    )}
                </div>
            </Rnd>
        
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
