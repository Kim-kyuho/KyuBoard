"use client";

import { useState } from "react";
import SignInModal from "./SignInModal";
import SignUpModal from "./SignUpModal";
import BoardZoomControl from "./BoardZoomControl";
import ImageCard from "./ImageCard";
import MemoCard from "@/components/MemoCard";
import BoardMenu from "./BoardMenu";
import BoardNavigator from "./BoardNavigator";
import BoardToolBar from "./BoardToolBar";
import BoardMessage from "./BoardMessage";
import BoardSearchPanel from "./BoardSearchPanel";
import { useBoardAuth } from "@/hooks/useBoardAuth";
import { useBoardImages } from "@/hooks/useBoardImages";
import { useBoardMemoFocus } from "@/hooks/useBoardMemoFocus";
import { useBoardMemos } from "@/hooks/useBoardMemos";
import { useBoardScroll } from "@/hooks/useBoardScroll";
import { useBoardSearch } from "@/hooks/useBoardSearch";
import { useBoardZoom } from "@/hooks/useBoardZoom";

interface Board {
  boardId: number;
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
    width: number;
    height: number;
}

interface Memo {
    id: number;
    boardId: number;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    isPublic: boolean;
}

// 보드 컴포넌트
export default function BoardClient(
  {boardIds, currentBoard, mappedImages, mappedMemos}:{boardIds: number[], currentBoard:Board, mappedImages: Image[], mappedMemos: Memo[]}
) {
    const boardWidth = currentBoard.width;
    const boardHeight = currentBoard.height;
    const [menuOpen, setMenuOpen] = useState(false);
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
            setMenuOpen={setMenuOpen}
            setSignInOpen={setSignInOpen}
            setSignUpOpen={setSignUpOpen}
            onSignOut={handleSignOut}
            currentUser={currentUser}
        />
        <BoardNavigator boardIds={boardIds} currentBoardId={currentBoard.boardId} onInvalidBoard={() => setPermissionMessage("This board does not exist.")}/>
        <BoardToolBar 
            setMenuOpen={setMenuOpen}
            setSearchBarOpen={setSearchBarOpen}
            setWriteClicked={setWriteClicked}
            canEditMemos={canEditMemos}
            onFocusPrevMemo={handleFocusPrevMemo}
            onFocusNextMemo={handleFocusNextMemo}
            onZoomControlOpen={showZoomControl}
            onImageUploadClick={handleImageUploadClick}
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
            ref={imageLocationRef}
            className="h-screen w-screen select-none overflow-auto bg-neutral-200"
            onClick={()=>{
                setPermissionMessage("");
                setMemoMessage("");
            }}
        >
            <div
                style={{
                    width: `${boardWidth * boardZoom}px`,
                    height: `${boardHeight * boardZoom}px`,
                }}
            >
                <div
                    className="kyu-board relative bg-white"
                    onPointerDown={handleBoardPanStart}
                    onPointerMove={handleBoardPanMove}
                    onPointerUp={handleBoardPanEnd}
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
                        />
                    ))}
                </div>
            </div>
        </main>
    </>
  );
}
