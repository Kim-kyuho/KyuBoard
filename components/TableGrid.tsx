"use client";

import { flexRender } from "@tanstack/react-table";
import { ArrowLeft, ArrowRight, Eye, Group, Pin, Plus, Trash2 } from "lucide-react";
import { useTableEdit } from "@/hooks/useTableEdit";
import { TableSource } from "@/lib/table-card";
import PressableButton from "./PressableButton";

type TableGridProps = {
    source: TableSource;
    isEditing: boolean;
    onChange: (source: TableSource) => void;
};

export default function TableGrid({ source, isEditing, onChange }: TableGridProps) {
    const {
        tableInstance,
        globalFilter,
        setGlobalFilter,
        rowSelection,
        selectedColumnId,
        setSelectedColumnId,
        selectedColumn,
        selectedColumnPinned,
        selectedColumnGrouped,
        addColumn,
        addRow,
        deleteSelectedRows,
        moveSelectedColumn,
    } = useTableEdit({ source, isEditing, onChange });

    return (
        <div className="flex h-full min-h-0 flex-col bg-white text-sm text-neutral-800">
            {isEditing && (
                <div className="shrink-0 border-b border-neutral-200 p-2">
                    <div className="flex flex-wrap items-center gap-2 pr-10">
                        <PressableButton className="flex h-8 items-center gap-1 px-2 text-xs" onClick={addRow}>
                            <Plus className="h-3.5 w-3.5" /> Row
                        </PressableButton>
                        <PressableButton className="flex h-8 items-center gap-1 px-2 text-xs" onClick={addColumn}>
                            <Plus className="h-3.5 w-3.5" /> Column
                        </PressableButton>
                        {Object.keys(rowSelection).length > 0 && (
                            <PressableButton className="flex h-8 items-center px-2 text-rose-600" onClick={deleteSelectedRows}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </PressableButton>
                        )}
                        <select
                            value={selectedColumnId}
                            onChange={(event) => setSelectedColumnId(event.target.value)}
                            className="h-8 max-w-32 rounded border border-neutral-200 bg-white px-1 text-xs outline-none"
                            aria-label="Selected column"
                        >
                            {source.columns.map((column) => (
                                <option key={column.id} value={column.id}>{column.name || "Untitled"}</option>
                            ))}
                        </select>
                        <button type="button" title="Move column left" onClick={() => moveSelectedColumn(-1)}>
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button type="button" title="Move column right" onClick={() => moveSelectedColumn(1)}>
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            title={selectedColumnPinned ? "Unpin column" : "Pin column"}
                            className={selectedColumnPinned ? "text-sky-600" : "text-neutral-500"}
                            onClick={() => selectedColumn?.pin(selectedColumnPinned ? false : "left")}
                        >
                            <Pin className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            title={selectedColumnGrouped ? "Ungroup column" : "Group column"}
                            className={selectedColumnGrouped ? "text-sky-600" : "text-neutral-500"}
                            onClick={() => selectedColumn?.toggleGrouping()}
                        >
                            <Group className="h-4 w-4" />
                        </button>
                        <details className="relative">
                            <summary className="flex h-8 cursor-pointer list-none items-center" title="Visible columns">
                                <Eye className="h-4 w-4" />
                            </summary>
                            <div className="absolute right-0 top-9 z-30 min-w-36 rounded bg-white p-2 shadow-md">
                                {tableInstance.getAllLeafColumns()
                                    .filter((column) => column.id !== "select")
                                    .map((column) => (
                                        <label key={column.id} className="flex items-center gap-2 py-1 text-xs">
                                            <input
                                                type="checkbox"
                                                checked={column.getIsVisible()}
                                                onChange={column.getToggleVisibilityHandler()}
                                            />
                                            <span>{source.columns.find((item) => item.id === column.id)?.name || "Untitled"}</span>
                                        </label>
                                    ))}
                            </div>
                        </details>
                    </div>
                    <input
                        value={globalFilter}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="mt-2 h-8 w-full rounded border border-neutral-200 px-2 outline-none focus:border-sky-400"
                        placeholder="Filter table"
                    />
                </div>
            )}

            <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full table-fixed border-collapse">
                    <thead className="sticky top-0 z-10 bg-neutral-100">
                        {tableInstance.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="relative border border-neutral-200 px-2 py-2 text-left"
                                        style={{
                                            width: `${(header.getSize() / tableInstance.getTotalSize()) * 100}%`,
                                            position: header.column.getIsPinned() ? "sticky" : "relative",
                                            left: header.column.getIsPinned() === "left" ? header.column.getStart("left") : undefined,
                                            zIndex: header.column.getIsPinned() ? 20 : undefined,
                                        }}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {isEditing && header.column.getCanFilter() && (
                                            <input
                                                value={(header.column.getFilterValue() as string) ?? ""}
                                                onChange={(event) => header.column.setFilterValue(event.target.value)}
                                                className="mt-1 h-6 w-full rounded border border-neutral-200 bg-white px-1 text-xs font-normal outline-none"
                                                placeholder="Filter"
                                            />
                                        )}
                                        {isEditing && header.column.getCanResize() && (
                                            <div
                                                className="absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none bg-sky-400/0 hover:bg-sky-400"
                                                onMouseDown={header.getResizeHandler()}
                                                onTouchStart={header.getResizeHandler()}
                                            />
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {tableInstance.getRowModel().rows.map((row) => (
                            <tr key={row.id} className={row.getIsSelected() ? "bg-sky-50" : "bg-white"}>
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className="h-9 border border-neutral-200 px-2 py-1 align-top"
                                        style={{
                                            width: `${(cell.column.getSize() / tableInstance.getTotalSize()) * 100}%`,
                                            position: cell.column.getIsPinned() ? "sticky" : undefined,
                                            left: cell.column.getIsPinned() === "left" ? cell.column.getStart("left") : undefined,
                                            background: cell.column.getIsPinned() ? "white" : undefined,
                                            zIndex: cell.column.getIsPinned() ? 5 : undefined,
                                        }}
                                    >
                                        {cell.getIsGrouped() ? (
                                            <button
                                                type="button"
                                                className="flex items-center gap-1 font-semibold"
                                                onClick={row.getToggleExpandedHandler()}
                                            >
                                                <span>{row.getIsExpanded() ? "−" : "+"}</span>
                                                <span>{String(cell.getValue() ?? "")}</span>
                                                <span className="text-neutral-400">({row.subRows.length})</span>
                                            </button>
                                        ) : cell.getIsAggregated() || cell.getIsPlaceholder() ? null : (
                                            flexRender(cell.column.columnDef.cell, cell.getContext())
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isEditing && tableInstance.getPageCount() > 1 && (
                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-2 py-1 text-xs">
                    <button type="button" disabled={!tableInstance.getCanPreviousPage()} onClick={() => tableInstance.previousPage()}>
                        Previous
                    </button>
                    <span>{tableInstance.getState().pagination.pageIndex + 1} / {tableInstance.getPageCount()}</span>
                    <button type="button" disabled={!tableInstance.getCanNextPage()} onClick={() => tableInstance.nextPage()}>
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
