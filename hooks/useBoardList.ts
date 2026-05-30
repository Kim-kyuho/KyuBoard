import { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CurrentUser } from "@/hooks/useBoardAuth";

export type BoardListBoard = {
    boardId: number;
    title: string;
    width: number;
    height: number;
};

type UseBoardListOptions = {
    boards: BoardListBoard[];
    currentUser: CurrentUser | null;
};

export function useBoardList({ boards, currentUser }: UseBoardListOptions) {
    const router = useRouter();
    const [boardList, setBoardList] = useState(boards);
    const [createBoardOpen, setCreateBoardOpen] = useState(false);
    const [boardListMessage, setBoardListMessage] = useState("");
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const longPressRef = useRef<number | null>(null);
    const longPressedRef = useRef(false);

    useEffect(() => {
        const handleClickOutside = (event: PointerEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setContextMenuOpen(false);
            }
        };

        document.addEventListener("pointerdown", handleClickOutside);
        return () => {
            document.removeEventListener("pointerdown", handleClickOutside);
        };
    }, []);

    const handleCreateBoardClick = () => {
        if (currentUser?.role !== "admin") {
            setBoardListMessage("Only administrators can create boards.");
            return;
        }

        setBoardListMessage("");
        setCreateBoardOpen(true);
    };

    const handleBoardCreated = (boardId: number) => {
        setCreateBoardOpen(false);
        router.push(`/boards/${boardId}`);
    };
    const openBoardContextMenu = (boardId: number, x: number, y: number) => {
        if (currentUser?.role !== "admin") {
            setBoardListMessage("Only administrators can delete boards.");
            return;
        }

        setBoardListMessage("");
        setSelectedBoardId(boardId);
        setContextMenuPosition({ x, y });
        setContextMenuOpen(true);
    };

    const clearLongPress = () => {
        if (longPressRef.current) {
            window.clearTimeout(longPressRef.current);
            longPressRef.current = null;
        }
    };

    const handleBoardClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
        if (longPressedRef.current) {
            event.preventDefault();
            longPressedRef.current = false;
        }
    };

    const handleBoardContextMenu = (boardId: number, event: ReactMouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        openBoardContextMenu(boardId, event.clientX, event.clientY);
    };

    const handleBoardLongPressStart = (boardId: number, event: ReactPointerEvent<HTMLAnchorElement>) => {
        if (event.pointerType !== "touch") {
            return;
        }

        clearLongPress();
        longPressedRef.current = false;
        longPressRef.current = window.setTimeout(() => {
            longPressedRef.current = true;
            openBoardContextMenu(boardId, event.clientX, event.clientY);
        }, 600);
    };

    const openDeleteDialog = () => {
        setContextMenuOpen(false);
        setDeleteDialogOpen(true);
    };

    const handleDeleteBoard = async () => {
        if (selectedBoardId === null) {
            return;
        }

        const response = await fetch(`/api/boards/${selectedBoardId}`, {
            method: "DELETE",
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
            setBoardListMessage(data.message ?? "Board could not be deleted.");
            setDeleteDialogOpen(false);
            return;
        }

        setBoardList((prev) => prev.filter((board) => board.boardId !== selectedBoardId));
        setDeleteDialogOpen(false);
        setSelectedBoardId(null);
        router.refresh();
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
    };

    return {
        boardList,
        createBoardOpen,
        setCreateBoardOpen,
        boardListMessage,
        setBoardListMessage,
        contextMenuOpen,
        contextMenuPosition,
        deleteDialogOpen,
        menuRef,
        handleCreateBoardClick,
        handleBoardCreated,
        handleBoardClick,
        handleBoardContextMenu,
        handleBoardLongPressStart,
        clearLongPress,
        openDeleteDialog,
        handleDeleteBoard,
        closeDeleteDialog,
    };
}
