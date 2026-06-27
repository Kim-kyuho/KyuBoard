"use client";

import { Rnd } from "react-rnd";
import { EllipsisVertical } from "lucide-react";
import { MermaidCardMermaid, useMermaidCard } from "@/hooks/useMermaidCard";
import type { InsertBoardMermaidInput, UpdateBoardMermaidInput } from "@/hooks/useBoardMermaids";
import { useMermaidRenderer } from "@/hooks/useMermaidRenderer";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ACTIVE_CARD_Z } from "@/lib/zIndex";
import MermaidActionMenu from "./MermaidActionMenu";

type MermaidCardProps = {
    mermaid: MermaidCardMermaid;
    zoom: number;
    canEdit: boolean;
    onPermissionDenied: () => void;
    onUpdate: (input: UpdateBoardMermaidInput) => void;
    onInsert: (input: InsertBoardMermaidInput) => void;
    onDelete: (id: number) => void;
    onBringToFront: () => void;
    onSendToBack: () => void;
};

export default function MermaidCard({
    mermaid,
    zoom,
    canEdit,
    onPermissionDenied,
    onInsert,
    onUpdate,
    onDelete,
    onBringToFront,
    onSendToBack,
}: MermaidCardProps) {
    const {
        actionMenuOpen,
        cardState,
        source,
        setSource,
        menuRef,
        isEditing,
        isResizing,
        deleteDialogOpen,
        dragHandlePressed,
        setDragHandlePressed,
        editMermaid,
        handleDoubleTap,
        handleMermaidPress,
        handleDragStop,
        handleResizeStart,
        handleResizeStop,
        openMermaidActionMenu,
        openDeleteDialog,
        closeDeleteDialog,
        confirmDelete,
    } = useMermaidCard({
        mermaid,
        canEdit,
        onPermissionDenied,
        onInsert,
        onUpdate,
        onDelete,
    });
    const { svg, renderError } = useMermaidRenderer({
        source,
        mermaidId: mermaid.id,
    });

    return (
        <>
            <Rnd
                data-editing={isEditing}
                cancel=".mermaid-action-menu"
                className={`mermaid-rnd-${mermaid.id} select-none rounded-xl ${isEditing ? "kyu-card-focused" : ""}`}
                style={{
                    zIndex: isEditing ? ACTIVE_CARD_Z : mermaid.z,
                }}
                default={{
                    x: mermaid.x,
                    y: mermaid.y,
                    width: mermaid.width,
                    height: mermaid.height,
                }}
                position={{
                    x: cardState.x,
                    y: cardState.y,
                }}
                size={{
                    width: cardState.width,
                    height: cardState.height,
                }}
                bounds="parent"
                scale={zoom}
                dragHandleClassName="mermaid-drag-handle"
                disableDragging={!isEditing || !canEdit}
                enableResizing={isEditing}
                onDragStop={handleDragStop}
                onResizeStart={handleResizeStart}
                onResizeStop={handleResizeStop}
            >
                <div
                    className="relative h-full w-full rounded-xl bg-white"
                    onClick={handleMermaidPress}
                    onDoubleClick={editMermaid}
                    onPointerDown={handleDoubleTap}
                >
                    {isEditing && (
                        <>
                            <button
                                type="button"
                                aria-label="Mermaid actions"
                                className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-neutral-500 opacity-30 backdrop-blur-sm transition duration-150 hover:bg-white/80 hover:text-neutral-900 hover:opacity-100 hover:shadow-sm active:scale-95"
                                onPointerUp={() => {
                                    openMermaidActionMenu();
                                }}
                            >
                                <EllipsisVertical className="h-8 w-8" />
                            </button>
                            {actionMenuOpen && (
                                <MermaidActionMenu
                                    ref={menuRef}
                                    zoom={zoom}
                                    onBringToFront={onBringToFront}
                                    onSendToBack={onSendToBack}
                                    onDelete={openDeleteDialog}
                                />
                            )}
                        </>
                    )}

                    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl">
                        {isEditing && (
                            <textarea
                                value={source}
                                onChange={(event) => setSource(event.target.value)}
                                className="h-2/5 min-h-24 resize-none border-b border-neutral-200 bg-neutral-50 p-3 font-mono text-base text-neutral-900 outline-none"
                                spellCheck={false}
                            />
                        )}

                        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3">
                            {renderError ? (
                                <pre className="w-full whitespace-pre-wrap rounded-md bg-rose-50 p-3 text-xs text-rose-700">
                                    {renderError}
                                </pre>
                            ) : svg ? (
                                <div
                                    className="mermaid-rendered h-full w-full"
                                    dangerouslySetInnerHTML={{ __html: svg }}
                                />
                            ) : (
                                <div className="text-sm text-neutral-400">Mermaid source is empty.</div>
                            )}
                        </div>

                        {isEditing && (
                            <div
                                className="mermaid-drag-handle absolute bottom-2 left-1/2 z-10 flex h-5 w-24 -translate-x-1/2 cursor-grab items-center justify-center rounded-full active:cursor-grabbing"
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
                </div>
            </Rnd>

            {deleteDialogOpen && (
                <ConfirmDialog
                    message="Delete this mermaid?"
                    onConfirm={confirmDelete}
                    onCancel={closeDeleteDialog}
                />
            )}
        </>
    );
}
