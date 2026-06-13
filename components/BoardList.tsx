"use client";

import Link from "next/link";
import { EllipsisVertical, Plus } from "lucide-react";
import { useState } from "react";
import BoardMenu from "./BoardMenu";
import BoardMessage from "./BoardMessage";
import SignInModal from "./SignInModal";
import SignUpModal from "./SignUpModal";
import CreateBoardModal from "./CreateBoardModal";
import RenameBoardModal from "./RenameBoardModal";
import ConfirmDialog from "./ConfirmDialog";
import BoardActionMenu from "./BoardActionMenu";
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
        renameBoardOpen,
        setRenameBoardOpen,
        boardListMessage,
        setBoardListMessage,
        actionMenuOpen,
        selectedBoardId,
        selectedBoardTitle,
        setSelectedBoardTitle,
        deleteDialogOpen,
        menuRef,
        handleCreateBoardClick,
        handleBoardCreated,
        handleBoardRenamed,
        handleBoardClick,
        openBoardActionMenu,
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

            {renameBoardOpen && selectedBoardId !== null && selectedBoardTitle !== null &&(
                <RenameBoardModal
                    boardId={selectedBoardId}
                    title={selectedBoardTitle}
                    onClose={() => setRenameBoardOpen(false)}
                    onRenamed={handleBoardRenamed}
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
                            <div
                                key={board.boardId}
                                className="group relative select-none rounded-lg bg-white shadow-sm ring-1 ring-neutral-200 transition hover:-translate-y-0.5 hover:shadow-md"
                                style={{
                                    WebkitTouchCallout: "none",
                                    WebkitUserSelect: "none",
                                    userSelect: "none",
                                    touchAction: "manipulation",
                                }}
                            >
                                <Link
                                    href={`/boards/${board.boardId}`}
                                    className="block overflow-hidden rounded-lg"
                                    draggable={false}
                                    onClick={handleBoardClick}
                                >
                                    <div>
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
                                <button
                                    type="button"
                                    aria-label="Board actions"
                                    className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-neutral-500 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-neutral-900 active:scale-95"
                                    onPointerDown={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                    }}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        openBoardActionMenu(board.boardId);
                                    }}
                                >
                                    <EllipsisVertical className="h-5 w-5" />
                                </button>
                                {actionMenuOpen && selectedBoardId === board.boardId && (
                                    <BoardActionMenu
                                        ref={menuRef}
                                        onRename={() => {
                                            setRenameBoardOpen(true);
                                            setSelectedBoardTitle(board.title);
                                            
                                        }}
                                        onDelete={openDeleteDialog}
                                    />
                                )}
                            </div>
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
