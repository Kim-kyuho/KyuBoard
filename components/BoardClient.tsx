"use client";

import { useState } from "react";
import MemoCard from "@/components/MemoCard";
import PressableButton from "@/components/PressableButton";
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

export default function BoardClient({mappedMemos}:{mappedMemos: Memo[]}) {
    // 보드 기본 크기 - 실제 메모 좌표계 기준으로 사용
    const boardWidth = 3840;
    const boardHeight = 2160;
    // 보드 줌 상태 - 보드 영역만 확대/축소하고 메뉴와 로고는 고정
    const [boardZoom, setBoardZoom] = useState(0.5);
    // 메모 리스트 상태
    const [memos,setMemos] = useState(mappedMemos);
    // 메뉴 열기/닫기 상태
    const [menuOpen, setMenuOpen] = useState(false);
    // Write 버튼 클릭 상태
    const [writeClicked, setWriteClicked] = useState(false);
    // 메모 생성을 위한 함수 - CreateMemo 컴포넌트에서 호출 보드 영역 클릭 시 해당 위치에 새로운 메모 생성
    const handleCreateTempMemo = (x: number, y: number) => {
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
        setMemos((prev) =>
                prev.map((memo) =>
                    memo.id === tempId ? { ...data.memo, isNew: false } : memo
                )
            );
        
      }

    // 메모 갱신를 위한 함수 - 보드 영역 클릭 시 AddMemo 컴포넌트를 호출하여 새로운 메모 생성
    const handleUpdateMemo = async (id: number, content: string, x: number, y: number, width: number, height: number, color: string, isPublic: boolean) => {
    await fetch(`/api/memos/${id}`, {
        method: "PATCH",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, x, y, width, height, color, isPublic }),
      });
      setMemos((prev) =>
          prev.map((memo) =>
          memo.id === id ? { ...memo, content, x, y, width, height, color, isPublic } : memo
          )
      );
    };
    // 메모삭제를 위한 함수 - MemoCard에서 호출 Delete 버튼 클릭 시 해당 메모 id를 받아서 memos 상태에서 삭제
    const handleDeleteMemo = async (id: number) => {
        await fetch(`/api/memos/${id}`, {
        method: "DELETE",
        });
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
            onClick={() => { setWriteClicked(true); 
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
        </div>
      )}
      {/* 줌 아웃 버튼 - 보드 영역만 축소하고 메뉴와 로고 크기는 유지 */}
      <PressableButton
        className="fixed right-20 top-5 z-50 bg-white/30 px-4 py-3 shadow-md"
        onClick={() => setBoardZoom((zoom) => Math.max(0.25, zoom - 0.1))}
        title="Zoom out"
      >
        <Minus className="w-5 h-5 text-neutral-900" />
      </PressableButton>
      {/* 줌 인 버튼 - 보드 영역만 확대하고 메뉴와 로고 크기는 유지 */}
      <PressableButton
        className="fixed right-5 top-5 z-50 bg-white/30 px-4 py-3 shadow-md"
        onClick={() => setBoardZoom((zoom) => Math.min(2, zoom + 0.1))}
        title="Zoom in"
      >
        <Plus className="w-5 h-5 text-neutral-900" />
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
              memos.map((memo) => <MemoCard key={memo.id} memo={memo} zoom={boardZoom} onInsert={handleInsertMemo} onUpdate={handleUpdateMemo} onDelete={handleDeleteMemo} />)}
            </div>
          </div>
      </main>
    </>
  );
}
