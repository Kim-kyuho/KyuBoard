"use client";

import { useState } from "react";
import SignInModal from "./SignInModal";
import SignUpModal from "./SignUpModal";
import BoardZoomControl from "./BoardZoomControl";
import ImageCard from "./ImageCard";
import MemoCard from "@/components/MemoCard";
import BoardMenu from "./BoardMenu";
import BoardToolBar from "./BoardToolBar";
import BoardMessage from "./BoardMessage";
import BoardSearchPanel from "./BoardSearchPanel";
import MermaidCard from "./MermaidCard";
import { useCardLayer } from "@/hooks/useCardLayer";
import { useBoardAuth } from "@/hooks/useBoardAuth";
import { useBoardImages } from "@/hooks/useBoardImages";
import { useBoardMermaids } from "@/hooks/useBoardMermaids";
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
    isPublic: boolean;
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

// 보드 컴포넌트
export default function BoardClient(
  {currentBoard, mappedImages, mappedMemos, mappedMermaids}:{currentBoard:Board, mappedImages: Image[], mappedMemos: Memo[], mappedMermaids: Mermaid[]}
) {
    const boardWidth = currentBoard.width;
    const boardHeight = currentBoard.height;
    const [menuOpen, setMenuOpen] = useState(false);
    const [showBoardToolBar, setShowBoardToolBar] = useState(true);
    const [writeClicked, setWriteClicked] = useState(false);
    const [permissionMessage, setPermissionMessage] = useState("");
    // **수정시 current-user.ts의 getMemoPermissionMessage를 함꼐 수정할 필요가 있음
    const showPermissionMessage = () => {
        setPermissionMessage(
            currentUser
                ? "Your account is waiting for administrator approval."
                : "Please sign in before editing memos."
        );
    };

    const {
        boardZoom,
        setBoardZoom,
        zoomOpen,
        zoomClosing,
        showZoomControl,
        handleZoomControlStart,
        handleZoomControlEnd,
    } = useBoardZoom();

    const {
        signInOpen, setSignInOpen,
        signUpOpen, setSignUpOpen,
        currentUser, setCurrentUser,
        canEditMemos,
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
        suppressBoardClickRef,
        handleBoardPanStart,
        handleBoardPanMove,
        handleBoardPanEnd,
    } = useBoardScroll({ writeClicked });

    const {
        memos,
        setMemos,
        handleCreateTempMemo,
        handleInsertMemo,
        handleUpdateMemo,
        handleDeleteMemo,
    } = useBoardMemos({
        initialMemos: mappedMemos,
        boardId: currentBoard.boardId,
        canEditMemos,
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
        imageLocationRef,
        imageInputRef,
        images,
        setImages,
        selectedImageId,
        setSelectedImageId,
        handleImageUploadClick,
        handleUploadImage,
        handleInsertImage,
        handleUpdateImage,
        handleDeleteImage,
    } = useBoardImages({
        initialImages: mappedImages,
        boardId: currentBoard.boardId,
        boardZoom,
        canEditMemos,
        showPermissionMessage,
        setPermissionMessage,
    });

    const {
        mermaids,
        setMermaids,
        handleCreateTempMermaid,
        handleInsertMermaid,
        handleUpdateMermaid,
        handleDeleteMermaid,
    } = useBoardMermaids({
        initialMermaids: mappedMermaids,
        boardId: currentBoard.boardId,
        boardZoom,
        canEditMemos,
        locationRef: imageLocationRef,
        showPermissionMessage,
        setPermissionMessage,
    });

    const { handleCardLayer } = useCardLayer({
        boardId: currentBoard.boardId,
        setMemos,
        setImages,
        setMermaids,
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
        />
        {/* <BoardNavigator boardIds={boardIds} currentBoardId={currentBoard.boardId} onInvalidBoard={() => setPermissionMessage("This board does not exist.")}/> */}
        <BoardToolBar 
            showBoardToolBar={showBoardToolBar}
            setShowBoardToolBar={setShowBoardToolBar}
            setMenuOpen={setMenuOpen}
            setSearchBarOpen={setSearchBarOpen}
            setWriteClicked={setWriteClicked}
            canEditMemos={canEditMemos}
            onFocusPrevMemo={handleFocusPrevMemo}
            onFocusNextMemo={handleFocusNextMemo}
            onZoomControlOpen={showZoomControl}
            onImageUploadClick={handleImageUploadClick}
            onMermaidCreateClick={handleCreateTempMermaid}
            onPermissionDenied={showPermissionMessage}
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
        <BoardZoomControl
            boardZoom={boardZoom}
            setBoardZoom={setBoardZoom}
            zoomOpen={zoomOpen}
            zoomClosing={zoomClosing}
            onZoomControlOpen={showZoomControl}
            onZoomControlStart={handleZoomControlStart}
            onZoomControlEnd={handleZoomControlEnd}
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
                ref={imageLocationRef}
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
                    onClick={(e)=>{
                        setPermissionMessage("");
                        setMemoMessage("");
                        if (suppressBoardClickRef.current) {
                            e.preventDefault();
                            e.stopPropagation();
                            suppressBoardClickRef.current = false;
                            return;
                        }
                        if(writeClicked)
                        {
                            // 화면 좌표를 실제 보드 좌표로 변환하기 위해 줌 값을 나눔
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = (e.clientX - rect.left) / boardZoom;
                            const y = (e.clientY - rect.top) / boardZoom; 
                            handleCreateTempMemo(x, y);
                            setWriteClicked(false);
                        }
                        }}
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
                            canEdit={canEditMemos}
                            isSelected={selectedImageId === image.imageId}
                            onSelect={() => setSelectedImageId(image.imageId)}
                            onSelectClear={() => setSelectedImageId(null)}
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
                            canEdit={canEditMemos}
                            isFocused={focusedMemoId === memo.id}
                            onFocus={() => setFocusedMemoId(memo.id)}
                            onFocusClear={() => setFocusedMemoId(null)}
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
                            canEdit={canEditMemos}
                            onPermissionDenied={showPermissionMessage}
                            onInsert={handleInsertMermaid}
                            onUpdate={handleUpdateMermaid}
                            onDelete={handleDeleteMermaid}
                            onBringToFront={() => handleCardLayer("mermaid", mermaid.id, "front")}
                            onSendToBack={() => handleCardLayer("mermaid", mermaid.id, "back")}
                        />
                    ))}
                </div>
            </div>
            </div>
        </main>
    </>
  );
}
