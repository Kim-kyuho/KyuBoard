"use client";

import { useEffect, useState } from "react";
import MemoCard from "@/components/MemoCard";
import PressableButton from "@/components/PressableButton";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import Link from "next/link";
import { Menu, Minus, Plus } from "lucide-react";

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
export default function BoardClient({mappedMemos}:{mappedMemos: Memo[]}) {
    // 보드 기본 크기 - 실제 메모 좌표계 기준으로 사용
    const boardWidth = 3840;
    const boardHeight = 2160;
    // 보드 줌 상태 - 보드 영역만 확대/축소하고 메뉴와 로고는 고정
    const [boardZoom, setBoardZoom] = useState(0.75);
    // 메모 리스트 상태
    const [memos,setMemos] = useState(mappedMemos);
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
    // Write 버튼 클릭 상태
    const [writeClicked, setWriteClicked] = useState(false);
    // 메모 조작 가능 상태 
    const canEditMemos = currentUser?.permissionFlg === true;

    // 현재의 유저 정보를 불러옴 (email, permissionFlg, role)
    useEffect(() => {
        const loadCurrentUser = async() => {
            const response = await fetch("/api/me");
            const data = await response.json();

            setCurrentUser(data.user ?? null);
        };

        loadCurrentUser();
    }, []);

    // SignOut을 위한 핸들러
    const handleSignOut = async() => {
        await fetch("/api/signout", {
            method: "POST",
        });
        setCurrentUser(null);
        setPermissionMessage("");
        setMenuOpen(false);
    };

    // 허가 메시지 출력 - **수정시 current-user.ts의 getMemoPermissionMessage를 함꼐 수정할 필요가 있음
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
          boardId: 1,
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
    // 메모 생성을 위한 함수
    const handleInsertMemo = async (tempId:number, boardId: number, content: string, x: number, y: number, width: number, height: number, color: string, isPublic: boolean) => {
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

    // 메모 갱신를 위한 함수 - 보드 영역 클릭 시 AddMemo 컴포넌트를 호출하여 새로운 메모 생성
    const handleUpdateMemo = async (id: number, content: string, x: number, y: number, width: number, height: number, color: string, isPublic: boolean) => {
    const response = await fetch(`/api/memos/${id}`, {
        method: "PATCH",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, x, y, width, height, color, isPublic }),
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
    // 메모삭제를 위한 함수 - MemoCard에서 호출 Delete 버튼 클릭 시 해당 메모 id를 받아서 memos 상태에서 삭제
    const handleDeleteMemo = async (id: number) => {
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

    // 페이지 영역
  return (
    <>
      <div className="fixed left-5 top-5 z-50 rounded-xl text-neutral-900 px-4 py-3 shadow-md" >
        {/* 로고 */}
        <Link
          href="/"
          className="transition duration-300 active:scale-105 active:rotate-1 text-sky-500 hover:text-pink-500 font-mono text-1xl sm:text-1xl font-extrabold"
        >
          •kyu.board
        </Link>
      </div>
      {/* 메뉴 버튼 */}
      <PressableButton className="fixed left-38 top-5 z-50 bg-white/30 px-4 py-3 shadow-md" 
      onClick={() => setMenuOpen((prev) => !prev)}>
        <Menu className="w-5 h-5 text-neutral-900 " />
      </PressableButton>
      
      {menuOpen && (
        <div className="fixed w-46 left-5 top-17 z-50 rounded-xl bg-white/30 px-4 py-3 shadow-md">
          {/* Search버튼: 메모를 검색하는 기능 */}
          <PressableButton 
            variant="menu"
            onClick={() => setMenuOpen(false)}>
              Search
          </PressableButton>
          {/* Recent버튼: 최근 작성한 메모를 보여주는 기능 */}
          <PressableButton 
            variant="menu"
            onClick={() => setMenuOpen(false)}>
              Recent
          </PressableButton>
          {/* Write버튼: 새로운 메모를 작성하는 기능 */}
          <PressableButton 
            variant="menu"
	            onClick={() => { 
                  if (!canEditMemos) {
                    showPermissionMessage();
                    setMenuOpen(false);
                    return;
                  }
	              setWriteClicked(true);
	              setMenuOpen(false);
            }}>
              Write
            </PressableButton>
          {/* View버튼: 작성한 메모를 보는 기능 */}
          <PressableButton 
            variant="menu"
            onClick={() => setMenuOpen(false)}>
              View
          </PressableButton>
          {/* Kyu.Log→버튼: Kyu.Log로 이동 */}
          <PressableButton 
            variant="menu"
            onClick={() => setMenuOpen(false)}>
              Kyu.Log→
          </PressableButton>
          {/* 현재 Sign-in 유저 존재하는 경우 : 존재하지 않는 경우 */}
          {currentUser ? (
            <div className="mt-3 border-t border-white/50 pt-3">
              <p className="mb-2 truncate px-2 text-sm font-semibold text-neutral-800">
                [{currentUser.role}] {currentUser.email}
              </p>
              {/* Sign-out 버튼 */}
              <PressableButton
                className="px-2 py-1 text-sm font-semibold text-sky-600 hover:text-sky-500"
                onClick={handleSignOut}>
                  Sign-out
              </PressableButton>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between border-t border-white/50 pt-3">
              {/* Sign-in 버튼 */}
              <PressableButton
                className="px-2 py-1 text-sm font-semibold text-sky-600 hover:text-sky-500"
                onClick={() => {
                  setMenuOpen(false);
                  setSignInOpen(true);
                }}>
                  Sign-in
              </PressableButton>
              {/* Sign-up 버튼 */}
              <PressableButton
                className="px-2 py-1 text-sm font-semibold text-sky-600 hover:text-sky-500"
                onClick={() => {
                  setMenuOpen(false);
                  setSignUpOpen(true);
                }}>
                  Sign-up
              </PressableButton>
            </div>
          )}
        </div>
      )}
      {/* Sign-in 버튼을 눌렀을 떄 Sign-in모달을 표시 */}
      {signInOpen && (
        <SignInModal
          onClose={() => setSignInOpen(false)}
          onSignIn={(user) => setCurrentUser(user)}
        />
      )}
      {/* Sign-up 버튼을 눌렀을 떄 Sign-in모달을 표시 */}
      {signUpOpen && <SignUpModal onClose={() => setSignUpOpen(false)} />}
      {/* Permission메시지가 존재할 떄 화면상에 표시 */}
      {permissionMessage && (
        <div
          className="fixed left-1/2 top-5 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-rose-600 shadow-md"
          style={{ zIndex: 60 }}
        >
          {permissionMessage}
        </div>
      )}
      {/* 줌 인 버튼 - 보드 영역만 확대하고 메뉴와 로고 크기는 유지 */}
      <PressableButton
        className="fixed right-5 bottom-20 z-50 bg-white/30 px-4 py-3 shadow-md"
        onClick={() => setBoardZoom((zoom) => Math.min(2, zoom + 0.1))}
        title="Zoom in"
      >
        <Plus className="w-5 h-5 text-neutral-900" />
      </PressableButton>
      {/* 줌 아웃 버튼 - 보드 영역만 축소하고 메뉴와 로고 크기는 유지 */}
      <PressableButton
        className="fixed right-5 bottom-5 z-50 bg-white/30 px-4 py-3 shadow-md"
        onClick={() => setBoardZoom((zoom) => Math.max(0.25, zoom - 0.1))}
        title="Zoom out"
      >
        <Minus className="w-5 h-5 text-neutral-900" />
      </PressableButton>
      <main className="h-screen w-screen overflow-auto bg-neutral-200">
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
                    const rect = e.currentTarget.getBoundingClientRect();
                    // 화면 좌표를 실제 보드 좌표로 변환하기 위해 줌 값을 나눔
                    const x = (e.clientX - rect.left) / boardZoom;
                    const y = (e.clientY - rect.top) / boardZoom; 
                    console.log(`Clicked at: (${x}, ${y})`);
                    handleCreateTempMemo(x, y);
                    setWriteClicked(false);
                  }
                  // 보드위를 클릭할 시 허가 메시지 해제
                  setPermissionMessage("");
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
              /* 메모카드 리스트를 랜더링 */
              memos.map((memo) => (
                <MemoCard
                  key={memo.id}
                  memo={memo}
                  zoom={boardZoom}
                  canEdit={canEditMemos}
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
