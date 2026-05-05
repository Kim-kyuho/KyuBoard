"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BoardMenu from "./BoardMenu";
import SignInModal from "./SignInModal";
import SignUpModal from "./SignUpModal";
import CreateBoardModal from "./CreateBoardModal";
import PressableButton from "./PressableButton";
import ConfirmDialog from "./ConfrimDialog";

type Board = {
    boardId: number;
    title: string;
    width: number;
    height: number;
};

type CurrentUser = {
    email: string;
    permissionFlg: boolean;
    role: string;
};

// 보드 리스트 컴포넌트 - 메인 화면에서 보드 목록과 보드 생성/삭제 메뉴를 표시
export default function BoardList({ boards }: { boards: Board[] }) {
    // 페이지 이동을 위한 라우터
    const router = useRouter();
    // 보드 리스트 상태 - 보드 삭제 시 화면에서 제거하기 위해 사용
    const [boardList, setBoardList] = useState(boards);
    // 메뉴 열기/닫기 상태
    const [menuOpen, setMenuOpen] = useState(false);
    // 로그인 모달 열기/닫기 상태
    const [signInOpen, setSignInOpen] = useState(false);
    // 회원가입 모달 열기/닫기 상태
    const [signUpOpen, setSignUpOpen] = useState(false);
    // 보드 생성 모달 열기/닫기 상태
    const [createBoardOpen, setCreateBoardOpen] = useState(false);
    // 현재 로그인 유저 상태
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    // 보드 리스트 화면에 출력할 메시지 상태
    const [boardMessage, setBoardMessage] = useState("");
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

    // 현재의 유저 정보를 불러옴 (email, permissionFlg, role)
    useEffect(() => {
        const loadCurrentUser = async () => {
            const response = await fetch("/api/me");
            const data = await response.json();

            setCurrentUser(data.user ?? null);
        };

        loadCurrentUser();
    }, []);

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

    // SignOut을 위한 핸들러
    const handleSignOut = async () => {
        await fetch("/api/signout", {
            method: "POST",
        });
        setCurrentUser(null);
        setMenuOpen(false);
    };

    // 보드 생성 버튼 클릭 핸들러 - admin권한이 없을 경우 메시지 출력
    const handleCreateBoardClick = () => {
        if (currentUser?.role !== "admin") {
            setBoardMessage("Only administrators can create boards.");
            return;
        }

        setBoardMessage("");
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
            setBoardMessage("Only administrators can delete boards.");
            return;
        }

        setBoardMessage("");
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
            setBoardMessage(data.message ?? "Board could not be deleted.");
            setDeleteDialogOpen(false);
            return;
        }

        setBoardList((prev) => prev.filter((board) => board.boardId !== selectedBoardId));
        setDeleteDialogOpen(false);
        setSelectedBoardId(null);
        router.refresh();
    };

    return (
        <>
            {/* 메뉴를 위한 컴포넌트 */}
            <BoardMenu
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                setSignInOpen={setSignInOpen}
                setSignUpOpen={setSignUpOpen}
                currentUser={currentUser}
                onSignOut={handleSignOut}
            />

            {/* Sign-in 버튼을 눌렀을 떄 Sign-in모달을 표시 */}
            {signInOpen && (
                <SignInModal
                    onClose={() => setSignInOpen(false)}
                    onSignIn={(user) => setCurrentUser(user)}
                />
            )}

            {/* Sign-up 버튼을 눌렀을 떄 Sign-up모달을 표시 */}
            {signUpOpen && (
                <SignUpModal
                    onClose={() => setSignUpOpen(false)}
                />
            )}

            {/* New Board 버튼을 눌렀을 때 보드 생성 모달을 표시 */}
            {createBoardOpen && (
                <CreateBoardModal
                    onClose={() => setCreateBoardOpen(false)}
                    onCreated={handleBoardCreated}
                />
            )}

            {/* 보드 권한/삭제 관련 메시지가 존재할 떄 화면상에 표시 */}
            {boardMessage && (
                <div
                    className="fixed left-1/2 top-5 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-rose-600 shadow-md"
                    style={{ zIndex: 60 }}
                >
                    {boardMessage}
                </div>
            )}

            {/* 보드 리스트 영역 */}
            <main className="min-h-screen bg-neutral-100 px-6 py-24">
                <div className="mx-auto max-w-4xl">
                <div className="grid grid-cols-2 gap-5">
                    {/* 보드 리스트를 카드 형태로 렌더링 */}
                    {boardList.map((board) => (
                        <Link
                            key={board.boardId}
                            href={`/boards/${board.boardId}`}
                            className="group block select-none"
                            draggable={false}
                            style={{
                                WebkitTouchCallout: "none",
                                WebkitUserSelect: "none",
                                userSelect: "none",
                                touchAction: "manipulation",
                            }}
                            // 길게 누름으로 메뉴가 열린 경우 링크 이동을 방지
                            onClick={(event) => {
                                if (longPressedRef.current) {
                                    event.preventDefault();
                                    longPressedRef.current = false;
                                }
                            }}
                            // 마우스 우클릭 이벤트 - 클릭한 좌표에 컨텍스트 메뉴를 표시
                            onContextMenu={(event) => {
                                event.preventDefault();
                                openBoardContextMenu(board.boardId, event.clientX, event.clientY);
                            }}
                            // 모바일에서 길게 누름 이벤트 - 터치한 좌표에 컨텍스트 메뉴를 표시
                            onPointerDown={(event) => {
                                if (event.pointerType !== "touch") {
                                    return;
                                }

                                clearLongPress();
                                longPressedRef.current = false;
                                longPressRef.current = window.setTimeout(() => {
                                    longPressedRef.current = true;
                                    openBoardContextMenu(board.boardId, event.clientX, event.clientY);
                                }, 600);
                            }}
                            onPointerUp={clearLongPress}
                            onPointerMove={clearLongPress}
                            onPointerCancel={clearLongPress}
                        >
                            {/* 보드 카드 */}
                            <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-neutral-200 transition group-hover:-translate-y-0.5 group-hover:shadow-md">
                                {/* 보드 미리보기 영역 */}
                                <div className="aspect-video bg-white">
                                    <div
                                        className="flex h-full w-full items-center justify-center text-2xl font-bold text-neutral-300"
                                        style={{
                                            backgroundImage:
                                                "radial-gradient(#d4d4d8 1px, transparent 1px)",
                                            backgroundSize: "12px 12px",
                                        }}
                                    />
                                </div>
                                {/* 보드 제목 영역 */}
                                <div className="border-t border-neutral-100 px-3 py-2">
                                    <p className="truncate text-sm font-semibold text-neutral-900">
                                        {board.title}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* New Board 버튼 - admin권한이 있는 경우 보드 생성 모달을 표시 */}
                    <button
                        type="button"
                        onClick={handleCreateBoardClick}
                        className="overflow-hidden rounded-lg bg-white text-left shadow-sm ring-1 ring-dashed ring-neutral-300 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <div className="flex aspect-video items-center justify-center bg-neutral-50">
                            <Plus className="h-8 w-8 text-neutral-500" />
                        </div>
                        <div className="border-t border-neutral-100 px-3 py-2">
                            <p className="truncate text-sm font-semibold text-neutral-700">
                                New Board
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </main>
            {/* 컨텍스트 메뉴: Delete 버튼이 있는 메뉴 - 보드 카드에서 우클릭 또는 길게 누름 시 열림 */}
            {contextMenuOpen && (
                <div
                    ref={menuRef}
                    className="fixed bg-white px-3 py-4 shadow-md"
                    style={{
                        left: `${contextMenuPosition.x}px`,
                        top: `${contextMenuPosition.y}px`,
                        zIndex: 65,
                    }}
                >
                    {/* Delete 버튼 */}
                    <PressableButton
                        variant="menu"
                        onClick={() => {
                            setContextMenuOpen(false);
                            setDeleteDialogOpen(true);
                        }}
                    >
                        Delete
                    </PressableButton>
                </div>
            )}

            {/* 삭제 확인 다이얼로그 - Yes 클릭 시 보드와 연결된 메모를 삭제, No 클릭 시 다이얼로그 닫기 */}
            {deleteDialogOpen && (
                <ConfirmDialog
                    message="Delete this board and all memos?"
                    onConfirm={handleDeleteBoard}
                    onCancel={() => {
                        setDeleteDialogOpen(false);
                    }}
                />
            )}
        </>
    );
}
