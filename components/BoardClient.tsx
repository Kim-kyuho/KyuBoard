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
    // 보드 기본 크기 - 실제 메모 좌표계 기준으로 사용
    const boardWidth = currentBoard.width;
    const boardHeight = currentBoard.height;
    // 메뉴 열기/닫기 상태
    const [menuOpen, setMenuOpen] = useState(false);
    // Write 버튼 클릭 상태
    const [writeClicked, setWriteClicked] = useState(false);
    // 권한이 없을 때 사용자에게 보여줄 메시지
    const [permissionMessage, setPermissionMessage] = useState("");
    // 허가 메시지 출력 핸들러 - **수정시 current-user.ts의 getMemoPermissionMessage를 함꼐 수정할 필요가 있음
    const showPermissionMessage = () => {
        setPermissionMessage(
            currentUser
                ? "Your account is waiting for administrator approval."
                : "Please sign in before editing memos."
        );
    };
    // 보드 확대/축소 상태와 핸들러를 관리하는 훅 - boardZoom 상태와 보드 확대/축소를 위한 핸들러들을 관리
    const {
        boardZoom,
        setBoardZoom,
        zoomOpen,
        zoomClosing,
        showZoomControl,
        handleZoomControlStart,
        handleZoomControlEnd,
    } = useBoardZoom();
    // 인증 상태와 핸들러를 관리하는 훅 - 현재 유저 정보, 로그인/로그아웃 핸들러 등을 관리
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
    // 보드 스크롤과 패닝 상태를 관리하는 훅 - 보드 스크롤 위치, 패닝 상태, 보드 패닝을 위한 핸들러들을 관리 
    const {
        boardScrollRef,
        boardPanning,
        suppressBoardClickRef,
        handleBoardPanStart,
        handleBoardPanMove,
        handleBoardPanEnd,
        getImageUploadPoint,
    } = useBoardScroll({ boardZoom, writeClicked });
    // 메모 상태와 핸들러를 관리하는 훅 - 보드의 메모 리스트, 메모 생성/업데이트/삭제 핸들러들을 관리
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
    // 메모 포커스 상태와 핸들러를 관리하는 훅 - 현재 포커스된 메모 id, 이전/다음 메모로 포커스 이동 핸들러들을 관리
    const {
        memoMessage,
        setMemoMessage,
        focusedMemoId,
        setFocusedMemoId,
        focusMemoById,
        handleFocusPrevMemo,
        handleFocusNextMemo,
    } = useBoardMemoFocus(memos);
    // 보드 검색 기능을 위한 훅 - useBoardSearch 훅에서 검색어, 검색 결과, 검색 인덱스 상태와 핸들러들을 관리
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
    // 이미지 업로드와 관리를 위한 훅 - 이미지 업로드 핸들러, 이미지 리스트, 선택된 이미지 id 상태 등을 관리
    const {
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
        canEditMemos,
        showPermissionMessage,
        setPermissionMessage,
        getImageUploadPoint,
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
      {/* 보드메뉴를 위한 컴포넌트 */}
      <BoardMenu
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            setSignInOpen={setSignInOpen}
            setSignUpOpen={setSignUpOpen}
            onSignOut={handleSignOut}
            currentUser={currentUser}
      />
      <BoardNavigator boardIds={boardIds} currentBoardId={currentBoard.boardId} onInvalidBoard={() => setPermissionMessage("This board does not exist.")}/>
      {/* 보드툴바를 위한 컴포넌트 */}
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
      {/* 검색바를 위한 컴포넌트 */}
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

      {/* Zoom컨트롤을 위한 컴포넌트 */}
      <BoardZoomControl
            boardZoom={boardZoom}
            setBoardZoom={setBoardZoom}
            zoomOpen={zoomOpen}
            zoomClosing={zoomClosing}
            onZoomControlOpen={showZoomControl}
            onZoomControlStart={handleZoomControlStart}
            onZoomControlEnd={handleZoomControlEnd}
      />

      {/* Sign-in 버튼을 눌렀을 떄 Sign-in모달을 표시 */}
      {signInOpen && (
      <SignInModal
            onClose={() => setSignInOpen(false)}
            onSignIn={(user) => setCurrentUser(user)}
      />
      )}
      {/* Sign-up 버튼을 눌렀을 떄 Sign-in모달을 표시 */}
      {signUpOpen && (
        <SignUpModal 
            onClose={() => setSignUpOpen(false)} 
        />
      )}
      {/* Permission메시지가 존재할 떄 화면상에 표시 */}
      <BoardMessage type = "permission" message = {permissionMessage} />
      {/* Memo메시지가 존재할 떄 화면상에 표시 */}
      <BoardMessage type = "memo" message = {memoMessage} />
    
      <main
            ref={boardScrollRef}
            className="h-screen w-screen select-none overflow-auto bg-neutral-200"
            onPointerDown={handleBoardPanStart}
            onPointerMove={handleBoardPanMove}
            onPointerUp={handleBoardPanEnd}
            onPointerCancel={handleBoardPanEnd}
            style={{
                cursor: boardPanning ? "grabbing" : "grab",
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
            }}
        >
        {/* 보드 영역: 사이즈 3840x2160, 그리드 배경, 메모 카드들이 배치되는 영역
          Wrtie버튼을 누르고 보드 영역을 클릭하면 해당 위치에 새로운 메모가 생성  
        */}
          {/* 줌 적용 후 실제 스크롤 크기를 맞추기 위한 보드 래퍼 */}
          <div
            style={{
              width: `${boardWidth * boardZoom}px`,
              height: `${boardHeight * boardZoom}px`,
            }}
          >
            {/* 실제 보드 영역 - transform scale로 보드만 확대/축소 */}
            <div
                className="kyu-board relative bg-white"
                onClick={(e)=>{
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
                        console.log(`Clicked at: (${x}, ${y})`);
                        handleCreateTempMemo(x, y);
                        setWriteClicked(false);
                    }
                    // 보드위를 클릭할 시 허가 메시지 해제
                    setPermissionMessage("");
                    setMemoMessage("");
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
                    }}
            >
              {
              /* 이미지카드 리스트를 랜더링 */
              images.map((image) => (
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
              {
              /* 메모카드 리스트를 랜더링 */
              memos.map((memo) => (
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
