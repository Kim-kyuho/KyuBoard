"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import BoardMenu from "./BoardMenu";
import BoardMessage from "./BoardMessage";
import SignInModal from "./SignInModal";
import SignUpModal from "./SignUpModal";
import CreateBoardModal from "./CreateBoardModal";
import ConfirmDialog from "./ConfrimDialog";
import BoardContextMenu from "./BoardContextMenu";
import { useBoardAuth } from "@/hooks/useBoardAuth";
import { BoardListBoard, useBoardList } from "@/hooks/useBoardList";

export default function BoardList({ boards }: { boards: BoardListBoard[] }) {
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

    const {
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
    } = useBoardList({
        boards,
        currentUser,
    });

    return (
        <>
            <BoardMenu
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                setSignInOpen={setSignInOpen}
                setSignUpOpen={setSignUpOpen}
                currentUser={currentUser}
                onSignOut={handleSignOut}
            />

            {signInOpen && (
                <SignInModal
                    onClose={() => setSignInOpen(false)}
                    onSignIn={(user) => setCurrentUser(user)}
                />
            )}

            {signUpOpen && (
                <SignUpModal
                    onClose={() => setSignUpOpen(false)}
                />
            )}

            {createBoardOpen && (
                <CreateBoardModal
                    ownerId={currentUser?.email ?? null}
                    onClose={() => setCreateBoardOpen(false)}
                    onCreated={handleBoardCreated}
                />
            )}

            <BoardMessage type = "permission" message = {boardListMessage} />

            <main className="min-h-screen bg-neutral-100 px-6 py-24" 
                onClick={() => 
                {
                    if (boardListMessage) {
                        setBoardListMessage("");
                    }
                }}
            >
                <div className="mx-auto max-w-4xl">
                    <div className="grid grid-cols-2 gap-5" >
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
                                onClick={handleBoardClick}
                                onContextMenu={(event) => handleBoardContextMenu(board.boardId, event)}
                                onPointerDown={(event) => handleBoardLongPressStart(board.boardId, event)}
                                onPointerUp={clearLongPress}
                                onPointerMove={clearLongPress}
                                onPointerCancel={clearLongPress}
                            >
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
                <BoardContextMenu
                    ref={menuRef}
                    contextMenuPosition={contextMenuPosition}
                    onDelete={openDeleteDialog}
                />
            )}

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
