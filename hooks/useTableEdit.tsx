import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    ColumnOrderState,
    ColumnPinningState,
    ColumnSizingState,
    CellContext,
    ExpandedState,
    GroupingState,
    HeaderContext,
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

type TableRow = TableSource["rows"][number];

type TableEditMeta = {
    source: TableSource;
    isEditing: boolean;
    updateCell: (rowId: string, columnId: string, value: string) => void;
    renameColumn: (columnId: string, name: string) => void;
    deleteColumn: (columnId: string) => void;
};

const getTableEditMeta = (meta: unknown) => meta as TableEditMeta;

function SelectHeader({ table }: HeaderContext<TableRow, unknown>) {
    return (
        <input
            type="checkbox"
            aria-label="Select all rows"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
    );
}

function SelectCell({ row }: CellContext<TableRow, unknown>) {
    return (
        <input
            type="checkbox"
            aria-label="Select row"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
        />
    );
}

function TableColumnHeader({ column, table }: HeaderContext<TableRow, unknown>) {
    const meta = getTableEditMeta(table.options.meta);
    const sourceColumn = meta.source.columns.find((item) => item.id === column.id);

    if (!sourceColumn) return null;

    return (
        <div className="flex min-w-0 items-center gap-1">
            {meta.isEditing ? (
                <input
                    value={sourceColumn.name}
                    aria-label="Column name"
                    className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
                    onChange={(event) => meta.renameColumn(column.id, event.target.value)}
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
            {meta.isEditing && meta.source.columns.length > 1 && (
                <button
                    type="button"
                    aria-label={`Delete ${sourceColumn.name}`}
                    className="shrink-0 text-neutral-300 hover:text-rose-500"
                    onClick={() => meta.deleteColumn(column.id)}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}

function TableColumnCell({ row, column, table }: CellContext<TableRow, unknown>) {
    const meta = getTableEditMeta(table.options.meta);
    const value = row.original.cells[column.id] ?? "";

    return meta.isEditing ? (
        <input
            value={value}
            className="h-full w-full bg-transparent outline-none"
            onChange={(event) => meta.updateCell(row.original.id, column.id, event.target.value)}
        />
    ) : (
        <span className="whitespace-pre-wrap wrap-break-words">{value}</span>
    );
}

export function useTableEdit({ source, isEditing, onChange }: UseTableEditOptions) {
    const sourceRef = useRef(source);
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
        sourceRef.current = source;
    }, [source]);

    useEffect(() => {
        const currentSource = sourceRef.current;
        const widthChanged = currentSource.columns.some(
            (column) => Math.round(columnSizing[column.id] ?? 160) !== Math.round(column.width ?? 160)
        );

        if (!widthChanged) return;

        onChange({
            ...currentSource,
            columns: currentSource.columns.map((column) => ({
                ...column,
                width: Math.round(columnSizing[column.id] ?? column.width ?? 160),
            })),
        });
    }, [columnSizing, onChange]);

    const updateCell = useCallback((rowId: string, columnId: string, value: string) => {
        const currentSource = sourceRef.current;

        onChange({
            ...currentSource,
            rows: currentSource.rows.map((row) => row.id === rowId
                ? { ...row, cells: { ...row.cells, [columnId]: value } }
                : row),
        });
    }, [onChange]);

    const renameColumn = useCallback((columnId: string, name: string) => {
        const currentSource = sourceRef.current;

        onChange({
            ...currentSource,
            columns: currentSource.columns.map((column) => column.id === columnId ? { ...column, name } : column),
        });
    }, [onChange]);

    const deleteColumn = useCallback((columnId: string) => {
        const currentSource = sourceRef.current;
        if (currentSource.columns.length === 1) return;

        onChange({
            columns: currentSource.columns.filter((column) => column.id !== columnId),
            rows: currentSource.rows.map((row) => {
                const cells = { ...row.cells };
                delete cells[columnId];
                return { ...row, cells };
            }),
        });
        setColumnOrder((prev) => prev.filter((id) => id !== columnId));
        setGrouping((prev) => prev.filter((id) => id !== columnId));
        setSelectedColumnId((prev) => prev === columnId
            ? currentSource.columns.find((column) => column.id !== columnId)?.id ?? ""
            : prev);
    }, [onChange]);

    const columnStructureKey = source.columns
        .map((column) => `${column.id}:${column.width ?? 160}`)
        .join("|");

    const columns = useMemo<ColumnDef<TableRow>[]>(() => [
        ...(isEditing ? [{
            id: "select",
            size: 36,
            enableSorting: false,
            enableColumnFilter: false,
            enableResizing: false,
            header: SelectHeader,
            cell: SelectCell,
        } satisfies ColumnDef<TableRow>] : []),
        ...source.columns.map((sourceColumn) => ({
            id: sourceColumn.id,
            accessorFn: (row) => row.cells[sourceColumn.id] ?? "",
            size: sourceColumn.width ?? 160,
            minSize: 80,
            header: TableColumnHeader,
            cell: TableColumnCell,
        } satisfies ColumnDef<TableRow>)),
        // input 재마운트를 방지하기 위해 source.columns 대신 columnStructureKey로 열 구조 변경만 감지
        // 의존성 배열에 source.columns가 포함되지 않아 출력되는 의존성 경고를 막기 위해 주석 추가
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [columnStructureKey, isEditing]);

    // React 컴파일러의 자동 최적화 경고를 막기 위해 주석 추가
    // eslint-disable-next-line react-hooks/incompatible-library
    const tableInstance = useReactTable({
        data: source.rows,
        columns,
        meta: {
            source,
            isEditing,
            updateCell,
            renameColumn,
            deleteColumn,
        } satisfies TableEditMeta,
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
        const currentSource = sourceRef.current;
        const id = crypto.randomUUID();
        onChange({
            columns: [...currentSource.columns, { id, name: `Column ${currentSource.columns.length + 1}`, width: 160 }],
            rows: currentSource.rows.map((row) => ({ ...row, cells: { ...row.cells, [id]: "" } })),
        });
        setColumnOrder((prev) => [...prev, id]);
        setSelectedColumnId(id);
    };

    const addRow = () => {
        const currentSource = sourceRef.current;
        onChange({
            ...currentSource,
            rows: [...currentSource.rows, {
                id: crypto.randomUUID(),
                cells: Object.fromEntries(currentSource.columns.map((column) => [column.id, ""])),
            }],
        });
    };

    const deleteSelectedRows = () => {
        const currentSource = sourceRef.current;
        const selectedIds = new Set(tableInstance.getSelectedRowModel().rows.map((row) => row.original.id));
        onChange({ ...currentSource, rows: currentSource.rows.filter((row) => !selectedIds.has(row.id)) });
        setRowSelection({});
    };

    const moveSelectedColumn = (direction: -1 | 1) => {
        setColumnOrder((prev) => {
            const currentSource = sourceRef.current;
            const sourceOrder = prev.filter((id) => currentSource.columns.some((column) => column.id === id));
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
