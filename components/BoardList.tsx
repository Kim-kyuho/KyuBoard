"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import BoardMenu from "./BoardMenu";
import BoardMessage from "./BoardMessage";
import SignInModal from "./SignInModal";
import SignUpModal from "./SignUpModal";
import CreateBoardModal from "./CreateBoardModal";
import PressableButton from "./PressableButton";
import ConfirmDialog from "./ConfrimDialog";
import { useBoardAuth } from "@/hooks/useBoardAuth";
import { BoardListBoard, useBoardList } from "@/hooks/useBoardList";

// 보드 리스트 컴포넌트 - 메인 화면에서 보드 목록과 보드 생성/삭제 메뉴를 표시
export default function BoardList({ boards }: { boards: BoardListBoard[] }) {
    // 메뉴 열기/닫기 상태
    const [menuOpen, setMenuOpen] = useState(false);
    const {
        signInOpen,
        setSignInOpen,
        signUpOpen,
        setSignUpOpen,
        currentUser,
        setCurrentUser,
        handleSignOut,
    } = useBoardAuth({
        onSignOutComplete: () => setMenuOpen(false),
    });
    // 보드 리스트와 보드 관련 상태/핸들러를 관리하는 훅 - 보드 리스트, 보드 생성/삭제 핸들러, 컨텍스트 메뉴 상태 등을 관리
    const {
        boardList,
        createBoardOpen,
        setCreateBoardOpen,
        permissionMessage,
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
    } = useBoardList({
        boards,
        currentUser,
    });

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
                    ownerId={currentUser?.email ?? null}
                    onClose={() => setCreateBoardOpen(false)}
                    onCreated={handleBoardCreated}
                />
            )}

            {/* 보드 권한/삭제 관련 메시지가 존재할 떄 화면상에 표시 */}
            <BoardMessage type = "permission" message = {permissionMessage} />

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
                            onClick={handleBoardClick}
                            // 마우스 우클릭 이벤트 - 클릭한 좌표에 컨텍스트 메뉴를 표시
                            onContextMenu={(event) => handleBoardContextMenu(board.boardId, event)}
                            // 모바일에서 길게 누름 이벤트 - 터치한 좌표에 컨텍스트 메뉴를 표시
                            onPointerDown={(event) => handleBoardLongPressStart(board.boardId, event)}
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
                        onClick={openDeleteDialog}
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
                    onCancel={closeDeleteDialog}
                />
            )}
        </>
    );
}
