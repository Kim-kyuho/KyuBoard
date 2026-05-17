"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import SignInModal from "./SignInModal";
import SignUpModal from "./SignUpModal";
import BoardZoomControl from "./BoardZoomControl"
import ImageCard from "./ImageCard";
import MemoCard from "@/components/MemoCard";
import BoardMenu from "./BoardMenu"
import BoardNavigator from "./BoardNavigator";
import BoardToolBar from "./BoardToolBar";
import BoardMessage from "./BoardMessage";
import BoardSearchPanel from "./BoardSearchPanel";

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
    file?: File;
    x: number;
    y: number;
    width: number;
    height: number;
}
interface Memo {
    id : number;
    boardId: number;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color : string;
    isPublic: boolean;
}

type CurrentUser = {
    email: string;
    permissionFlg: boolean;
    role: string;
};
// 보드 컴포넌트
export default function BoardClient(
  {boardIds, currentBoard, mappedImages, mappedMemos}:{boardIds: number[], currentBoard:Board, mappedImages: Image[], mappedMemos: Memo[]}
)
  {
    // 보드 기본 크기 - 실제 메모 좌표계 기준으로 사용
    const boardWidth = currentBoard.width;
    const boardHeight = currentBoard.height;
    // 검색바 오픈 상태
    const [searchBarOpen, setSearchBarOpen] = useState(false); 
    // 검색어 상태
    const [searchText, setSearchText] = useState("");
    // 현재 검색 결과 인덱스
    const [searchIndex, setSearchIndex] = useState(0);
    // 보드 줌 상태 - 보드 영역만 확대/축소하고 메뉴와 로고는 고정
    const [boardZoom, setBoardZoom] = useState(0.75);
    // 보드 줌 컨트롤러 오픈 상태 - 보드 영역을 확대/축소 하는 컨트롤러
    const [zoomOpen, setZoomOpen] = useState(false);
    // 줌이 자동으로 닫히는 상태 - 조작 중이 아닐때, 줌 컨트롤러를 사라지게 함
    const [zoomClosing, setZoomClosing] = useState(false);
    // 줌 컨트롤러의 자동 페이드아웃을 예약하는 타이머 ID 
    const zoomTimerRef = useRef<number | null>(null);
    // 줌 컨틑롤러의 페이드아웃 이후 컨트롤러를 숨기는 타이머 ID
    const zoomCloseTimerRef = useRef<number | null>(null);
    // 줌 컨틀로러의 조작 상태
    const zoomInteractingRef = useRef(false);
    // 보드 스크롤 영역 ref - 이미지 업로드 위치 계산에 사용
    const boardScrollRef = useRef<HTMLElement | null>(null);
    // 이미지 파일 업로드 input ref - 툴바 버튼 클릭 시 파일 선택창을 열기 위해 사용
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    // 메모 리스트 상태
    const [memos,setMemos] = useState(mappedMemos);
    // 이미지 리스트 상태
    const [images, setImages] = useState(mappedImages);
    // 메뉴 열기/닫기 상태
    const [menuOpen, setMenuOpen] = useState(false);
    // 로그인 모달 열기/닫기 상태
    const [signInOpen, setSignInOpen] = useState(false);
    // 회원가입 모달 열기/닫기 상태
    const [signUpOpen, setSignUpOpen] = useState(false);
    // 화면 표시용 로그인 유저 상태 - 권한 최종 판단은 서버 API에서 처리
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    // 권한이 없을 때 사용자에게 보여줄 메시지
    const [permissionMessage, setPermissionMessage] = useState("");
    // 메모 이동/탐색 관련 메시지 상태
    const [memoMessage, setMemoMessage] = useState("");
    // Write 버튼 클릭 상태
    const [writeClicked, setWriteClicked] = useState(false);
    // 현재 포커스된 메모 ID 상태
    const [focusedMemoId, setFocusedMemoId] = useState<number | null>(null);
    // 현재 선택된 이미지 ID 상태
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
    // 최초 진입 시 가장 ID가 빠른 메모로 이동했는지 저장
    const initialMemoFocusRef = useRef(false);
    // 메모 조작 가능 상태 
    const canEditMemos = currentUser?.permissionFlg === true;
    // 메모 ID를 오름차순으로 정렬한 리스트
    const sortedMemoIds = useMemo(
        () => memos.map((memo) => memo.id).sort((a, b) => a - b),
        [memos]
    );

    // 메모 ID를 기준으로 해당 메모에 포커스를 주고 화면을 이동
    const focusMemoById = useCallback((memoId: number | null) => {
        setMemoMessage("");
        setFocusedMemoId(memoId);
        window.setTimeout(() => {
            document
                .querySelector(`.memo-rnd-${memoId}`)
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "center",
                });
        }, 0);
    }, []);

    // 검색어에 해당하는 메모 리스트
    const searchResults = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        if (!query) {
            return [];
        }

        return memos.filter((memo) =>
            memo.content.toLowerCase().includes(query)
        );
    }, [memos, searchText]);

    // 검색 결과 메모로 이동
    const focusSearchResult = (index: number) => {
        const targetMemo = searchResults[index];

        if (!targetMemo) {
            setMemoMessage("No search results.");
            return;
        }

        setSearchIndex(index);
        focusMemoById(targetMemo.id);
    };

    // 다음 검색 결과 이동
    const handleSearchNext = () => {
        if (searchResults.length === 0) {
            setMemoMessage("No search results.");
            return;
        }

        const nextIndex = searchIndex >= searchResults.length - 1
            ? 0
            : searchIndex + 1;

        focusSearchResult(nextIndex);
    };

    // 이전 검색 결과 이동
    const handleSearchPrev = () => {
        if (searchResults.length === 0) {
            setMemoMessage("No search results.");
            return;
        }

        const prevIndex = searchIndex <= 0
            ? searchResults.length - 1
            : searchIndex - 1;

        focusSearchResult(prevIndex);
    };

    // 검색어 변경
    const handleSearchTextChange = (query: string) => {
        setSearchText(query);
        setSearchIndex(0);

        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) {
            return;
        }

        const firstMemo = memos.find((memo) =>
            memo.content.toLowerCase().includes(normalizedQuery)
        );

        if (firstMemo) {
            focusMemoById(firstMemo.id);
        }
    };

    // 현재의 유저 정보를 불러옴 (email, permissionFlg, role)
    useEffect(() => {
        const loadCurrentUser = async() => {
            const response = await fetch("/api/me");
            const data = await response.json();

            setCurrentUser(data.user ?? null);
        };

        loadCurrentUser();
    }, []);

    // 보드 진입 시 가장 ID가 빠른 메모로 이동
    useEffect(() => {
        if (initialMemoFocusRef.current || sortedMemoIds.length === 0) {
            return;
        }

        initialMemoFocusRef.current = true;
        focusMemoById(sortedMemoIds[0]);
    }, [focusMemoById, sortedMemoIds]);

    // 이전 메모로 이동하기 위한 핸들러
    const handleFocusPrevMemo = () => {
        if (sortedMemoIds.length === 0) {
            setMemoMessage("No memos exist.");
            return;
        }

        const currentIndex = focusedMemoId === null
            ? -1
            : sortedMemoIds.indexOf(focusedMemoId);

        if (currentIndex === -1) {
            focusMemoById(sortedMemoIds[0]);
            return;
        }

        const prevMemoId = currentIndex > 0
            ? sortedMemoIds[currentIndex - 1]
            : null;
        
        if (!prevMemoId) {
            setMemoMessage("Prev memo does not exist.");
            return;
        }

        focusMemoById(prevMemoId);
    };

    // 다음 메모로 이동하기 위한 핸들러
    const handleFocusNextMemo = () => {
        if (sortedMemoIds.length === 0) {
            setMemoMessage("No memo exist.");
            return;
        }

        const currentIndex = focusedMemoId === null
            ? -1
            : sortedMemoIds.indexOf(focusedMemoId);

        if (currentIndex === -1) {
            focusMemoById(sortedMemoIds[0]);
            return;
        }

        const nextMemoId = currentIndex >= 0 && currentIndex < sortedMemoIds.length - 1
            ? sortedMemoIds[currentIndex + 1]
            : null;
        
        if (!nextMemoId) {
            setMemoMessage("Next memo does not exist.");
            return;
        }

        focusMemoById(nextMemoId);
    };

    // SignOut을 위한 핸들러
    const handleSignOut = async() => {
        await fetch("/api/signout", {
            method: "POST",
        });
        setCurrentUser(null);
        setPermissionMessage("");
        setMemoMessage("");
        setMenuOpen(false);
    };
    
    // 줌 컨트롤러 출력을 위한 핸들러
    const showZoomControl = () => {
        setZoomOpen(true);
        setZoomClosing(false);
        if (!zoomInteractingRef.current) {
            startZoomCloseTimer();
        }
    };

    // 줌 컴트롤러 페이드아웃 타이머를 위한 함수
    const startZoomCloseTimer = () => {
        clearZoomTimers();
        zoomTimerRef.current = window.setTimeout(() => {
            if (zoomInteractingRef.current) {
                return;
            }

            setZoomClosing(true);
            zoomCloseTimerRef.current = window.setTimeout(() => {
                setZoomOpen(false);
                setZoomClosing(false);
            }, 300);
        }, 2000);
    };

    // 줌 컨트롤러 타이머의 클리어를 위한 함수
    const clearZoomTimers = () => {
        if (zoomTimerRef.current) {
            window.clearTimeout(zoomTimerRef.current);
            zoomTimerRef.current = null;
        }
        if (zoomCloseTimerRef.current) {
            window.clearTimeout(zoomCloseTimerRef.current);
            zoomCloseTimerRef.current = null;
        }
    };

    // 줌 컨트롤러 조작할 경우(onFocus)를 위한 핸들러
    const handleZoomControlStart = () => {
        zoomInteractingRef.current = true;
        setZoomOpen(true);
        setZoomClosing(false);
        clearZoomTimers();
    };
    // 줌 컨트롤러 조작하지 않을 경우(onBlur)를 위한 핸들러
    const handleZoomControlEnd = () => {
        zoomInteractingRef.current = false;
        startZoomCloseTimer();
    };

    // 허가 메시지 출력 핸들러 - **수정시 current-user.ts의 getMemoPermissionMessage를 함꼐 수정할 필요가 있음
    const showPermissionMessage = () => {
        setPermissionMessage(
            currentUser
                ? "Your account is waiting for administrator approval."
                : "Please sign in before editing memos."
        );
    };
    // 메모 생성을 위한 핸들러 - CreateMemo 컴포넌트에서 호출 보드 영역 클릭 시 해당 위치에 새로운 메모 생성
    const handleCreateTempMemo = (x: number, y: number) => {
        if (!canEditMemos) {
            showPermissionMessage();
            return;
        }

        const tempMemo: Memo = {
          id: -Date.now(),
          boardId: currentBoard.boardId,
          content: "",
          x,
          y,
          width: 300,
          height: 200,
          color: "yellow",
          isPublic: true,
        };
        setMemos((prev) => [...prev, tempMemo]);
    };
    // 메모 생성을 위한 핸들러
    const handleInsertMemo = async (tempId: number, boardId: number, content: string, x: number, y: number, width: number, height: number, color: string, isPublic: boolean) => {
        const response = await fetch("/api/memos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            boardId, content, x, y, width, height, color, isPublic
           }), 
        });
        
        const data = await response.json();
        if (!data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to edit memos.");
            return;
        }
        setMemos((prev) =>
                prev.map((memo) =>
                    memo.id === tempId ? { ...data.memo, isNew: false } : memo
                )
            );
      }

    // 메모 갱신를 위한 핸들러 - 보드 영역 클릭 시 AddMemo 컴포넌트를 호출하여 새로운 메모 생성
    const handleUpdateMemo = async (id: number, boardId: number, content: string, x: number, y: number, width: number, height: number, color: string, isPublic: boolean) => {
        const response = await fetch(`/api/memos/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ boardId, content, x, y, width, height, color, isPublic }),
        });
        const data = await response.json();
        if (!data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to edit memos.");
            return;
        }
        setMemos((prev) =>
            prev.map((memo) =>
                memo.id === id ? { ...memo, content, x, y, width, height, color, isPublic } : memo
            )
        );
    };
    // 메모삭제를 위한 핸들러 - MemoCard에서 호출 Delete 버튼 클릭 시 해당 메모 id를 받아서 memos 상태에서 삭제
    const handleDeleteMemo = async (id: number) => {
        // DB에 저장되기 전의 임시 메모일 경우 API리퀘스트를 하지 않고 삭제
        if (id < 0) {
            setMemos((prev) => 
                prev.filter((memo) => memo.id !== id));
            return;
        }

        const response = await fetch(`/api/memos/${id}`, {
        method: "DELETE",
        });
        const data = await response.json();
        if (!data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to edit memos.");
            return;
        }
        setMemos((prev) => prev.filter((memo) => memo.id !== id)); 
    };

    // 이미지 업로드 버튼 클릭 핸들러 - 파일 선택 input을 실행
    const handleImageUploadClick = () => {
        if (!canEditMemos) {
            showPermissionMessage();
            return;
        }

        imageInputRef.current?.click();
    };

    // 이미지 업로드 위치 계산 함수 - 현재 보이는 보드 화면의 중앙에 이미지를 생성
    const getImageUploadPoint = () => {
        const scrollElement = boardScrollRef.current;
        if (!scrollElement) {
            return { x: 0, y: 0 };
        }

        return {
            x: Math.max(0, (scrollElement.scrollLeft + scrollElement.clientWidth / 2) / boardZoom - 200),
            y: Math.max(0, (scrollElement.scrollTop + scrollElement.clientHeight / 2) / boardZoom - 150),
        };
    };

    // 이미지 초기 표시 크기 계산 함수 - 400x300 안에 들어오도록 원본 비율을 유지해서 축소
    const getImageDisplaySize = (file: File) =>
        new Promise<{ width: number; height: number }>((resolve) => {
            const imageUrl = URL.createObjectURL(file);
            const image = document.createElement("img");

            image.onload = () => {
                const maxWidth = 400;
                const maxHeight = 300;
                const scale = Math.min(
                    maxWidth / image.naturalWidth,
                    maxHeight / image.naturalHeight,
                    1
                );

                URL.revokeObjectURL(imageUrl);
                resolve({
                    width: Math.round(image.naturalWidth * scale),
                    height: Math.round(image.naturalHeight * scale),
                });
            };

            image.onerror = () => {
                URL.revokeObjectURL(imageUrl);
                resolve({ width: 400, height: 300 });
            };

            image.src = imageUrl;
        });

    // 이미지 업로드 핸들러 - 선택한 파일을 임시 이미지로 생성하고 저장은 ImageCard에서 처리
    const handleUploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) {
            return;
        }
        if (!canEditMemos) {
            showPermissionMessage();
            return;
        }

        const { x, y } = getImageUploadPoint();
        const { width, height } = await getImageDisplaySize(file);
        const tempImageUrl = URL.createObjectURL(file);
        const tempImage: Image = {
            imageId: -Date.now(),
            boardId: currentBoard.boardId,
            publicId: "",
            secureUrl: tempImageUrl,
            fileName: file.name,
            file,
            x: Math.round(x),
            y: Math.round(y),
            width,
            height,
        };

        setImages((prev) => [...prev, tempImage]);
        setSelectedImageId(tempImage.imageId);
    };

    // 이미지 생성을 위한 핸들러 - ImageCard에서 저장 확인 시 파일을 API로 전송하고 반환된 이미지 정보로 교체
    const handleInsertImage = async (tempId: number, file: File, boardId: number, x: number, y: number, width: number, height: number) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("boardId", String(boardId));
        formData.append("x", String(x));
        formData.append("y", String(y));
        formData.append("width", String(width));
        formData.append("height", String(height));

        const response = await fetch("/api/images", {
            method: "POST",
            body: formData,
        });
        const data = await response.json();

        if (!data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to upload images.");
            return;
        }

        const tempImage = images.find((image) => image.imageId === tempId);
        if (tempImage?.secureUrl) {
            URL.revokeObjectURL(tempImage.secureUrl);
        }

        setImages((prev) =>
            prev.map((image) =>
                image.imageId === tempId ? data.image : image
            )
        );
        setSelectedImageId(data.image.imageId);
    };

    // 이미지 갱신을 위한 핸들러 - ImageCard에서 이동, 크기 조절 완료 시 호출
    const handleUpdateImage = async (imageId: number, boardId: number, publicId: string, secureUrl: string, fileName: string | null, x: number, y: number, width: number, height: number) => {
        const response = await fetch(`/api/images/${imageId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ boardId, publicId, secureUrl, fileName, x, y, width, height }),
        });
        const data = await response.json();

        if (!data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to edit images.");
            return;
        }

        setImages((prev) =>
            prev.map((image) =>
                image.imageId === imageId ? { ...image, boardId, publicId, secureUrl, fileName, x, y, width, height } : image
            )
        );
    };

    // 이미지 삭제를 위한 핸들러 - Cloudinary 이미지와 DB 데이터를 함께 삭제
    const handleDeleteImage = async (imageId: number) => {
        if (imageId < 0) {
            const tempImage = images.find((image) => image.imageId === imageId);
            if (tempImage?.secureUrl) {
                URL.revokeObjectURL(tempImage.secureUrl);
            }

            setImages((prev) => prev.filter((image) => image.imageId !== imageId));
            setSelectedImageId(null);
            return;
        }

        const response = await fetch(`/api/images/${imageId}`, {
            method: "DELETE",
        });
        const data = await response.json();

        if (!data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to delete images.");
            return;
        }

        setImages((prev) => prev.filter((image) => image.imageId !== imageId));
        setSelectedImageId(null);
    };

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
    
      <main ref={boardScrollRef} className="h-screen w-screen overflow-auto bg-neutral-200">
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
