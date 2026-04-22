"use client";

import { useState } from "react";
import MemoCard from "@/components/MemoCard";
import PressableButton from "@/components/PressableButton";
import Link from "next/link";

interface Memo {
    id : number;
    boardId: number;
    content: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    color? : string;
    isPublic?: boolean;
}

export default function BoardClient({mappedMemos}:{mappedMemos: Memo[]}) {
    // 메모 리스트 상태
    const [memos,setMemos] = useState(mappedMemos);
    // 메뉴 열기/닫기 상태
    const [menuOpen, setMenuOpen] = useState(false);
    // Write 버튼 클릭 상태
    const [writeClicked, setWriteClicked] = useState(false);

    // 메모 생성을 위한 함수 - CreateMemo 컴포넌트에서 호출 보드 영역 클릭 시 해당 위치에 새로운 메모 생성
    const handleCreateMemo = async (x: number, y: number) => {
        const response = await fetch("/api/memos", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
            boardId: 1,
            content: "",
            x,
            y,
            width: 300,
            height: 500,
            color: "yellow",
            isPublic: true,
           }), 
        });
        const data = await response.json();
        setMemos((prev) => [...prev, data.memo]);
    };

    // 메모 추가를 위한 함수 - 보드 영역 클릭 시 AddMemo 컴포넌트를 호출하여 새로운 메모 생성
    const handleSaveMemo = async (id: number, content: string) => {
    await fetch(`/api/memos/${id}`, {
        method: "PATCH",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
    });

        setMemos((prev) =>
            prev.map((memo) =>
            memo.id === id ? { ...memo, content } : memo
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
    <main className="h-screen w-screen overflow-auto bg-neutral-200">
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
        <PressableButton className="fixed left-38 top-7 z-50 bg-white/30 px-4 py-3 shadow-md" 
        onClick={() => setMenuOpen((prev) => !prev)}>
        <div className="flex flex-col gap-1">
            <span className="block h-0.5 w-5 bg-neutral-800" />
            <span className="block h-0.5 w-5 bg-neutral-800" />
            <span className="block h-0.5 w-5 bg-neutral-800" />
          </div>
        </PressableButton>
      {menuOpen && (
        <div className="fixed w-46 left-5  top-17 z-50 rounded-xl bg-white/30 px-4 py-3 shadow-md">
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
      {/* 보드 영역: 사이즈 3840x2160, 그리드 배경, 메모 카드들이 배치되는 영역
        Wrtie버튼을 누르고 보드 영역을 클릭하면 해당 위치에 새로운 메모가 생성  
      */}
      <div
        className="relative bg-white"
        onClick={(e)=>{
            if(writeClicked)
            {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top; 
              console.log(`Clicked at: (${x}, ${y})`);
              handleCreateMemo(x, y);
              setWriteClicked(false);
            }
        }}
        style={{
          width: '3840px',
          height: '2160px',
          backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {
        /* 메모카드 리스트를 랜더링 */
        memos.map((memo) => <MemoCard key={memo.id} memo={memo} onDelete={handleDeleteMemo} onSave={handleSaveMemo} />)}
      </div>
    </main>
  );
}
