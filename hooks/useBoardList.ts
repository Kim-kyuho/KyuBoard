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
    // 페이지 이동을 위한 라우터
    const router = useRouter();
    // 보드 리스트 상태 - 보드 삭제 시 화면에서 제거하기 위해 사용
    const [boardList, setBoardList] = useState(boards);
    // 보드 생성 모달 열기/닫기 상태
    const [createBoardOpen, setCreateBoardOpen] = useState(false);
    // 보드 리스트 화면에 출력할 메시지 상태
    const [boardListMessage, setBoardListMessage] = useState("");
    // 보드 컨텍스트 메뉴 열기/닫기 상태
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    // 보드 컨텍스트 메뉴 위치 상태
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    // 삭제 대상으로 선택된 보드 ID 상태
    const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
    // 보드 삭제 확인 다이얼로그 열기/닫기 상태
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    // 컨텍스트 메뉴 외부 클릭 감지를 위한 ref
    const menuRef = useRef<HTMLDivElement | null>(null);
    // 모바일에서 길게 누름 이벤트 감지를 위한 타이머 ID 저장
    const longPressRef = useRef<number | null>(null);
    // 길게 누름으로 컨텍스트 메뉴가 열린 상태인지 저장
    const longPressedRef = useRef(false);

    // 보드 컨텍스트 메뉴 외부 클릭 감지
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

    // 보드 생성 버튼 클릭 핸들러 - admin권한이 없을 경우 메시지 출력
    const handleCreateBoardClick = () => {
        if (currentUser?.role !== "admin") {
            setBoardListMessage("Only administrators can create boards.");
            return;
        }

        setBoardListMessage("");
        setCreateBoardOpen(true);
    };

    // 보드 생성 완료 핸들러 - 생성된 보드 페이지로 이동
    const handleBoardCreated = (boardId: number) => {
        setCreateBoardOpen(false);
        router.push(`/boards/${boardId}`);
    };

    // 보드 컨텍스트 메뉴 오픈 핸들러 - admin권한이 없을 경우 메시지 출력
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

    // 모바일 길게 누름 타이머 클리어
    const clearLongPress = () => {
        if (longPressRef.current) {
            window.clearTimeout(longPressRef.current);
            longPressRef.current = null;
        }
    };

    const handleBoardClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
        // 길게 누름으로 메뉴가 열린 경우 링크 이동을 방지
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

    // 보드 삭제 핸들러 - 보드와 연결된 메모를 서버 API에서 함께 삭제
    const handleDeleteBoard = async () => {
        if (selectedBoardId === null) {
            return;
        }

        const response = await fetch(`/api/boards/${selectedBoardId}`, {
            method: "DELETE",
        });
        const data = await response.json();

        if (!data.ok) {
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
