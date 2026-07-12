import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    ColumnOrderState,
    ColumnPinningState,
    ColumnSizingState,
    ExpandedState,
    GroupingState,
    RowSelectionState,
    SortingState,
    VisibilityState,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getGroupedRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { TableSource } from "@/lib/table-card";

type UseTableEditOptions = {
    source: TableSource;
    isEditing: boolean;
    onChange: (source: TableSource) => void;
};

export function useTableEdit({ source, isEditing, onChange }: UseTableEditOptions) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => source.columns.map((column) => column.id));
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({});
    const [grouping, setGrouping] = useState<GroupingState>([]);
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const [selectedColumnId, setSelectedColumnId] = useState(source.columns[0]?.id ?? "");
    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() =>
        Object.fromEntries(source.columns.map((column) => [column.id, column.width ?? 160]))
    );

    useEffect(() => {
        const widthChanged = source.columns.some(
            (column) => Math.round(columnSizing[column.id] ?? 160) !== Math.round(column.width ?? 160)
        );

        if (!widthChanged) return;

        onChange({
            ...source,
            columns: source.columns.map((column) => ({
                ...column,
                width: Math.round(columnSizing[column.id] ?? column.width ?? 160),
            })),
        });
    }, [columnSizing, onChange, source]);

    const updateCell = useCallback((rowId: string, columnId: string, value: string) => {
        onChange({
            ...source,
            rows: source.rows.map((row) => row.id === rowId
                ? { ...row, cells: { ...row.cells, [columnId]: value } }
                : row),
        });
    }, [onChange, source]);

    const renameColumn = useCallback((columnId: string, name: string) => {
        onChange({
            ...source,
            columns: source.columns.map((column) => column.id === columnId ? { ...column, name } : column),
        });
    }, [onChange, source]);

    const deleteColumn = useCallback((columnId: string) => {
        if (source.columns.length === 1) return;

        onChange({
            columns: source.columns.filter((column) => column.id !== columnId),
            rows: source.rows.map((row) => {
                const cells = { ...row.cells };
                delete cells[columnId];
                return { ...row, cells };
            }),
        });
        setColumnOrder((prev) => prev.filter((id) => id !== columnId));
        setGrouping((prev) => prev.filter((id) => id !== columnId));
        setSelectedColumnId((prev) => prev === columnId
            ? source.columns.find((column) => column.id !== columnId)?.id ?? ""
            : prev);
    }, [onChange, source]);

    const columns = useMemo<ColumnDef<TableSource["rows"][number]>[]>(() => [
        ...(isEditing ? [{
            id: "select",
            size: 36,
            enableSorting: false,
            enableColumnFilter: false,
            enableResizing: false,
            header: ({ table }) => (
                <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={table.getIsAllPageRowsSelected()}
                    onChange={table.getToggleAllPageRowsSelectedHandler()}
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    aria-label="Select row"
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                />
            ),
        } satisfies ColumnDef<TableSource["rows"][number]>] : []),
        ...source.columns.map((sourceColumn) => ({
            id: sourceColumn.id,
            accessorFn: (row) => row.cells[sourceColumn.id] ?? "",
            size: sourceColumn.width ?? 160,
            minSize: 80,
            header: ({ column }) => (
                <div className="flex min-w-0 items-center gap-1">
                    {isEditing ? (
                        <input
                            value={sourceColumn.name}
                            aria-label="Column name"
                            className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
                            onChange={(event) => renameColumn(sourceColumn.id, event.target.value)}
                        />
                    ) : (
                        <span className="min-w-0 flex-1 truncate">{sourceColumn.name}</span>
                    )}
                    <button
                        type="button"
                        aria-label={`Sort ${sourceColumn.name}`}
                        className="shrink-0 text-neutral-400 hover:text-neutral-800"
                        onClick={column.getToggleSortingHandler()}
                    >
                        {column.getIsSorted() === "asc" ? <ArrowUp className="h-3.5 w-3.5" />
                            : column.getIsSorted() === "desc" ? <ArrowDown className="h-3.5 w-3.5" />
                                : <ArrowUp className="h-3.5 w-3.5 opacity-30" />}
                    </button>
                    {isEditing && source.columns.length > 1 && (
                        <button
                            type="button"
                            aria-label={`Delete ${sourceColumn.name}`}
                            className="shrink-0 text-neutral-300 hover:text-rose-500"
                            onClick={() => deleteColumn(sourceColumn.id)}
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            ),
            cell: ({ row }) => isEditing ? (
                <input
                    value={row.original.cells[sourceColumn.id] ?? ""}
                    className="h-full w-full bg-transparent outline-none"
                    onChange={(event) => updateCell(row.original.id, sourceColumn.id, event.target.value)}
                />
            ) : (
                <span className="whitespace-pre-wrap wrap-break-words">{row.original.cells[sourceColumn.id] ?? ""}</span>
            ),
        } satisfies ColumnDef<TableSource["rows"][number]>)),
    ], [deleteColumn, isEditing, renameColumn, source.columns, updateCell]);

    // TanStack Table exposes mutable handler functions that React Compiler intentionally skips.
    // eslint-disable-next-line react-hooks/incompatible-library
    const tableInstance = useReactTable({
        data: source.rows,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            rowSelection,
            columnSizing,
            columnOrder,
            columnVisibility,
            columnPinning,
            grouping,
            expanded,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        onColumnOrderChange: setColumnOrder,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnPinningChange: setColumnPinning,
        onGroupingChange: setGrouping,
        onExpandedChange: setExpanded,
        onColumnSizingChange: setColumnSizing,
        getRowId: (row) => row.id,
        enableRowSelection: true,
        columnResizeMode: "onChange",
        autoResetPageIndex: false,
        autoResetExpanded: false,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getGroupedRowModel: getGroupedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 8 } },
    });

    const addColumn = () => {
        const id = crypto.randomUUID();
        onChange({
            columns: [...source.columns, { id, name: `Column ${source.columns.length + 1}`, width: 160 }],
            rows: source.rows.map((row) => ({ ...row, cells: { ...row.cells, [id]: "" } })),
        });
        setColumnOrder((prev) => [...prev, id]);
        setSelectedColumnId(id);
    };

    const addRow = () => {
        onChange({
            ...source,
            rows: [...source.rows, {
                id: crypto.randomUUID(),
                cells: Object.fromEntries(source.columns.map((column) => [column.id, ""])),
            }],
        });
    };

    const deleteSelectedRows = () => {
        const selectedIds = new Set(tableInstance.getSelectedRowModel().rows.map((row) => row.original.id));
        onChange({ ...source, rows: source.rows.filter((row) => !selectedIds.has(row.id)) });
        setRowSelection({});
    };

    const moveSelectedColumn = (direction: -1 | 1) => {
        setColumnOrder((prev) => {
            const sourceOrder = prev.filter((id) => source.columns.some((column) => column.id === id));
            const currentIndex = sourceOrder.indexOf(selectedColumnId);
            const nextIndex = currentIndex + direction;
            if (currentIndex < 0 || nextIndex < 0 || nextIndex >= sourceOrder.length) return prev;

            const next = [...sourceOrder];
            [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
            return next;
        });
    };

    const selectedColumn = tableInstance.getColumn(selectedColumnId);

    return {
        tableInstance,
        globalFilter,
        setGlobalFilter,
        rowSelection,
        selectedColumnId,
        setSelectedColumnId,
        selectedColumn,
        selectedColumnPinned: selectedColumn?.getIsPinned() === "left",
        selectedColumnGrouped: selectedColumn?.getIsGrouped(),
        addColumn,
        addRow,
        deleteSelectedRows,
        moveSelectedColumn,
    };
}
