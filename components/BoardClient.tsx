"use client";

import { useRef, useState } from "react";
import SignInModal from "./SignInModal";
import SignUpModal from "./SignUpModal";
import ImageCard from "./ImageCard";
import MemoCard from "@/components/MemoCard";
import BoardMenu from "./BoardMenu";
import BoardToolBar from "./BoardToolBar";
import BoardMessage from "./BoardMessage";
import BoardSearchPanel from "./BoardSearchPanel";
import BoardMarkdownView from "./BoardMarkdownView";
import MermaidCard from "./MermaidCard";
import TableCard from "./TableCard";
import { useCardLayer } from "@/hooks/useCardLayer";
import { useBoardAuth } from "@/hooks/useBoardAuth";
import { useBoardImages } from "@/hooks/useBoardImages";
import { useBoardMermaids } from "@/hooks/useBoardMermaids";
import { useBoardTables } from "@/hooks/useBoardTables";
import type { TableSource } from "@/lib/table-card";
import { useBoardMemoFocus } from "@/hooks/useBoardMemoFocus";
import { useBoardMemos } from "@/hooks/useBoardMemos";
import { useBoardScroll } from "@/hooks/useBoardScroll";
import { useBoardSearch } from "@/hooks/useBoardSearch";
import { useBoardZoom } from "@/hooks/useBoardZoom";

interface Board {
  boardId: number;
  title: string;
  width: number;
  height: number;
}

interface Image {
    imageId: number;
    boardId: number;
    publicId: string;
    secureUrl: string;
    fileName: string | null;
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
}

interface Memo {
    id: number;
    boardId: number;
    content: string;
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
    color: string;
}

interface Mermaid {
    id: number;
    boardId: number;
    source: string;
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
}

interface Table {
    id: number;
    boardId: number;
    source: TableSource;
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
}

// 보드 컴포넌트
export default function BoardClient(
  {currentBoard, mappedImages, mappedMemos, mappedMermaids, mappedTables}:{currentBoard:Board, mappedImages: Image[], mappedMemos: Memo[], mappedMermaids: Mermaid[], mappedTables: Table[]}
) {
    const boardWidth = currentBoard.width;
    const boardHeight = currentBoard.height;
    const cardLocationRef = useRef<HTMLDivElement | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [markdownViewOpen, setMarkdownViewOpen] = useState(false);
    const [permissionMessage, setPermissionMessage] = useState("");
    const showPermissionMessage = () => {
        setPermissionMessage(
            currentUser
                ? "Your account is waiting for administrator approval."
                : "Please sign in before editing cards."
        );
    };

    const {
        boardZoom,
        setBoardZoom,
    } = useBoardZoom();

    const {
        signInOpen, setSignInOpen,
        signUpOpen, setSignUpOpen,
        currentUser, setCurrentUser,
        canEditCard,
        handleSignOut,
    } = useBoardAuth({
        onSignOutComplete: () => {
            setPermissionMessage("");
            setMemoMessage("");
            setMenuOpen(false);
        },
    });

    const {
        boardPanning,
        handleBoardPanStart,
        handleBoardPanMove,
        handleBoardPanEnd,
    } = useBoardScroll();

    const {
        imageInputRef,
        images,
        setImages,
        editingImageId,
        setEditingImageId,
        handleImageUploadClick,
        handleUploadImage,
        handleInsertImage,
        handleUpdateImage,
        handleDeleteImage,
    } = useBoardImages({
        initialImages: mappedImages,
        boardId: currentBoard.boardId,
        boardZoom,
        cardLocationRef,
        canEditCard,
        showPermissionMessage,
        setPermissionMessage,
    });

    const {
        memos,
        setMemos,
        editingMemoId,
        setEditingMemoId,
        handleCreateTempMemo,
        handleInsertMemo,
        handleUpdateMemo,
        handleDeleteMemo,
    } = useBoardMemos({
        initialMemos: mappedMemos,
        boardId: currentBoard.boardId,
        boardZoom,
        cardLocationRef,
        canEditCard,
        showPermissionMessage,
        setPermissionMessage,
    });

    const {
        memoMessage,
        setMemoMessage,
        focusedMemoId,
        setFocusedMemoId,
        focusMemoById,
        handleFocusPrevMemo,
        handleFocusNextMemo,
    } = useBoardMemoFocus(memos);

    const {
        searchBarOpen,
        setSearchBarOpen,
        searchText,
        searchIndex,
        searchResults,
        handleSearchTextChange,
        handleSearchPrev,
        handleSearchNext,
    } = useBoardSearch({
        memos,
        focusMemoById,
        setMemoMessage,
    });

    const {
        mermaids,
        setMermaids,
        editingMermaidId,
        setEditingMermaidId,
        handleCreateTempMermaid,
        handleInsertMermaid,
        handleUpdateMermaid,
        handleDeleteMermaid,
    } = useBoardMermaids({
        initialMermaids: mappedMermaids,
        boardId: currentBoard.boardId,
        boardZoom,
        canEditCard,
        cardLocationRef,
        showPermissionMessage,
        setPermissionMessage,
    });

    const {
        tables,
        setTables,
        editingTableId,
        setEditingTableId,
        handleCreateTempTable,
        handleInsertTable,
        handleUpdateTable,
        handleDeleteTable,
    } = useBoardTables({
        initialTables: mappedTables,
        boardId: currentBoard.boardId,
        boardZoom,
        canEditCard,
        cardLocationRef,
        showPermissionMessage,
        setPermissionMessage,
    });

    const isEditing =
        editingMemoId !== null ||
        editingImageId !== null ||
        editingMermaidId !== null ||
        editingTableId !== null;

    const { handleCardLayer } = useCardLayer({
        boardId: currentBoard.boardId,
        setMemos,
        setImages,
        setMermaids,
        setTables,
        setPermissionMessage,
    });

  return (
    <>
        <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUploadImage}
        />
        <BoardMenu
            menuOpen={menuOpen}
            currentBoard={currentBoard}
            setMenuOpen={setMenuOpen}
            setSignInOpen={setSignInOpen}
            setSignUpOpen={setSignUpOpen}
            onSignOut={handleSignOut}
            currentUser={currentUser}
            onCompileMarkdown={() => setMarkdownViewOpen(true)}
        />
        {/* <BoardNavigator boardIds={boardIds} currentBoardId={currentBoard.boardId} onInvalidBoard={() => setPermissionMessage("This board does not exist.")}/> */}
        <BoardToolBar
            cardEditing={isEditing}
            boardZoom={boardZoom}
            setBoardZoom={setBoardZoom}
            setMenuOpen={setMenuOpen}
            setSearchBarOpen={setSearchBarOpen}
            onFocusPrevMemo={handleFocusPrevMemo}
            onFocusNextMemo={handleFocusNextMemo}
            onMemoCreateClick={handleCreateTempMemo}
            onImageUploadClick={handleImageUploadClick}
            onMermaidCreateClick={handleCreateTempMermaid}
            onTableCreateClick={handleCreateTempTable}
        />
        {searchBarOpen && (
            <BoardSearchPanel
                searchText={searchText}
                currentIndex={searchResults.length > 0 ? searchIndex + 1 : 0}
                searchCount={searchResults.length}
                onTextChange={handleSearchTextChange}
                onPrev={handleSearchPrev}
                onNext={handleSearchNext}
            />
        )}
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
        {markdownViewOpen && (
            <BoardMarkdownView
                boardId={currentBoard.boardId}
                onClose={() => setMarkdownViewOpen(false)}
            />
        )}
        <BoardMessage type = "permission" message = {permissionMessage} />
        <BoardMessage type = "memo" message = {memoMessage} />
    
         <main
            className="h-screen w-screen select-none bg-neutral-200"
            onClick={()=>{
                setPermissionMessage("");
                setMemoMessage("");
            }}
        >
            <div
                ref={cardLocationRef}
                className="board-scroll-layer h-full w-full overflow-auto"
                onPointerDown={handleBoardPanStart}
                onPointerMove={handleBoardPanMove}
                onPointerUp={handleBoardPanEnd}
            >
            <div
                className="board-size-layer"
                style={{
                    width: `${boardWidth * boardZoom}px`,
                    height: `${boardHeight * boardZoom}px`,
                }}
            >
                <div
                    className="kyu-board relative bg-white"
                    style={{
                            width: `${boardWidth}px`,
                            height: `${boardHeight}px`,
                            transform: `scale(${boardZoom})`,
                            transformOrigin: "top left",
                            backgroundImage: "radial-gradient(#d4d4d8 1px, transparent 1px)",
                            backgroundSize: "24px 24px",
                            WebkitUserSelect: "none",
                            userSelect: "none",
                            WebkitTouchCallout: "none",
                            cursor: boardPanning ? "grabbing" : "grab",
                        }}
                >
                    {images.map((image) => (
                        <ImageCard
                            key={image.imageId}
                            image={image}
                            zoom={boardZoom}
                            canEdit={canEditCard}
                            isEditing={editingImageId === image.imageId}
                            onEditing={() => setEditingImageId(image.imageId)}
                            onEditingClear={() => setEditingImageId(null)}
                            onPermissionDenied={showPermissionMessage}
                            onInsert={handleInsertImage}
                            onUpdate={handleUpdateImage}
                            onDelete={handleDeleteImage}
                            onBringToFront={() => handleCardLayer("image", image.imageId, "front")}
                            onSendToBack={() => handleCardLayer("image", image.imageId, "back")}
                        />
                    ))}
                    {memos.map((memo) => (
                        <MemoCard
                            key={memo.id}
                            memo={memo}
                            zoom={boardZoom}
                            canEdit={canEditCard}
                            isEditing={editingMemoId === memo.id}
                            isFocused={focusedMemoId === memo.id}
                            onFocus={() => setFocusedMemoId(memo.id)}
                            onFocusClear={() => setFocusedMemoId(null)}
                            onEditing={() => setEditingMemoId(memo.id)}
                            onEditingClear={() => setEditingMemoId(null)}
                            onPermissionDenied={showPermissionMessage}
                            onInsert={handleInsertMemo}
                            onUpdate={handleUpdateMemo}
                            onDelete={handleDeleteMemo}
                            onBringToFront={() => handleCardLayer("memo", memo.id, "front")}
                            onSendToBack={() => handleCardLayer("memo", memo.id, "back")}
                        />
                    ))}
                    {mermaids.map((mermaid) => (
                        <MermaidCard
                            key={mermaid.id}
                            mermaid={mermaid}
                            zoom={boardZoom}
                            canEdit={canEditCard}
                            isEditing={editingMermaidId === mermaid.id}
                            onEditing={() => setEditingMermaidId(mermaid.id)}
                            onEditingClear={() => setEditingMermaidId(null)}
                            onPermissionDenied={showPermissionMessage}
                            onInsert={handleInsertMermaid}
                            onUpdate={handleUpdateMermaid}
                            onDelete={handleDeleteMermaid}
                            onBringToFront={() => handleCardLayer("mermaid", mermaid.id, "front")}
                            onSendToBack={() => handleCardLayer("mermaid", mermaid.id, "back")}
                        />
                    ))}
                    {tables.map((table) => (
                        <TableCard
                            key={table.id}
                            table={table}
                            zoom={boardZoom}
                            canEdit={canEditCard}
                            isEditing={editingTableId === table.id}
                            onEditing={() => setEditingTableId(table.id)}
                            onEditingClear={() => setEditingTableId(null)}
                            onPermissionDenied={showPermissionMessage}
                            onInsert={handleInsertTable}
                            onUpdate={handleUpdateTable}
                            onDelete={handleDeleteTable}
                            onBringToFront={() => handleCardLayer("table", table.id, "front")}
                            onSendToBack={() => handleCardLayer("table", table.id, "back")}
                        />
                    ))}
                </div>
            </div>
            </div>
        </main>
    </>
  );
}
