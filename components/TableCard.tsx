"use client";

import { Rnd } from "react-rnd";
import { EllipsisVertical } from "lucide-react";
import { BoardTable } from "@/hooks/useBoardTables";
import { useTableCard } from "@/hooks/useTableCard";
import { ACTIVE_CARD_Z } from "@/lib/zIndex";
import ConfirmDialog from "./ConfirmDialog";
import TableActionMenu from "./TableActionMenu";
import TableGrid from "./TableGrid";

type TableCardProps = {
    table: BoardTable;
    zoom: number;
    canEdit: boolean;
    isEditing: boolean;
    onEditing: () => void;
    onEditingClear: () => void;
    onPermissionDenied: () => void;
    onInsert: (table: BoardTable) => void;
    onUpdate: (table: BoardTable) => void;
    onDelete: (id: number) => void;
    onBringToFront: () => void;
    onSendToBack: () => void;
};

export default function TableCard({
    table,
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
}: TableCardProps) {
    const {
        source,
        setSource,
        cardState,
        dragHandlePressed,
        setDragHandlePressed,
        actionMenuOpen,
        deleteDialogOpen,
        menuRef,
        editTable,
        handleDoubleTap,
        handleTablePress,
        handleDragStop,
        handleResizeStop,
        openActionMenu,
        closeActionMenu,
        openDeleteDialog,
        closeDeleteDialog,
        confirmDelete,
    } = useTableCard({
        table,
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
                cancel=".table-action-menu"
                className={`table-rnd-${table.id} select-none rounded-xl ${isEditing ? "card-editing" : ""}`}
                style={{ zIndex: isEditing ? ACTIVE_CARD_Z : table.z }}
                position={{ x: cardState.x, y: cardState.y }}
                size={{ width: cardState.width, height: cardState.height }}
                bounds="parent"
                scale={zoom}
                dragHandleClassName="table-drag-handle"
                disableDragging={!isEditing || !canEdit}
                enableResizing={isEditing}
                minWidth={360}
                minHeight={240}
                onDragStop={handleDragStop}
                onResizeStop={handleResizeStop}
            >
                <div
                    className="relative h-full w-full overflow-hidden rounded-xl bg-white"
                    onClick={handleTablePress}
                    onDoubleClick={editTable}
                    onPointerDown={handleDoubleTap}
                >
                    {isEditing && (
                        <>
                            <button
                                type="button"
                                aria-label="Table actions"
                                className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-neutral-500 opacity-60 backdrop-blur-sm transition hover:text-neutral-900 hover:opacity-100 hover:shadow-sm active:scale-95"
                                onPointerUp={openActionMenu}
                            >
                                <EllipsisVertical className="h-6 w-6" />
                            </button>
                            {actionMenuOpen && (
                                <TableActionMenu
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
                        </>
                    )}

                    <TableGrid source={source} isEditing={isEditing} onChange={setSource} />

                    {isEditing && (
                        <div
                            className="table-drag-handle absolute bottom-2 left-1/2 z-20 flex h-5 w-24 -translate-x-1/2 cursor-grab items-center justify-center rounded-full active:cursor-grabbing"
                            onPointerDown={() => setDragHandlePressed(true)}
                            onPointerUp={() => setDragHandlePressed(false)}
                            onPointerCancel={() => setDragHandlePressed(false)}
                            onPointerLeave={() => setDragHandlePressed(false)}
                        >
                            <div className={`h-1.5 w-24 rounded-full transition ${dragHandlePressed ? "bg-black/70" : "bg-black/25"}`} />
                        </div>
                    )}

                </div>
            </Rnd>

            {deleteDialogOpen && (
                <ConfirmDialog
                    message="Delete this table?"
                    onConfirm={confirmDelete}
                    onCancel={closeDeleteDialog}
                />
            )}
        </>
    );
}
