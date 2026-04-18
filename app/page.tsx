'use client';

import MemoCard from "@/components/MemoCard";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const memos = [{
    id: 1,
    content : "KyuBoard 첫번째 메모",
    x: 240,
    y: 180,
    width: 500,
    height: 300,
    color: 'yellow',
    isPublic: true,
  },
  {
    id: 2,
    content : "KyuBoard 두번째 메모",
    x: 800,
    y: 300,
    width: 500,
    height: 300,
    color: 'yellow',
    isPublic: false,
  }]

  return (
    <main className="h-screen w-screen overflow-auto bg-neutral-200">
        <div className="fixed left-5 top-5 z-50 rounded-xl text-neutral-900 px-4 py-3 shadow-md" >
          <Link
            href="/"
            className="transition duration-300 active:scale-105 active:rotate-1 text-sky-500 hover:text-pink-500 font-mono text-1xl sm:text-1xl font-extrabold"
          >
            •kyu.board
          </Link>
        </div>
        <button className="fixed left-38 top-7 z-50 rounded-xl bg-white/30 px-4 py-3 shadow-md" 
        onClick={() => setMenuOpen((prev) => !prev)}>
        <div className="flex flex-col gap-1">
            <span className="block h-0.5 w-5 bg-neutral-800" />
            <span className="block h-0.5 w-5 bg-neutral-800" />
            <span className="block h-0.5 w-5 bg-neutral-800" />
          </div>
        </button>
      {menuOpen && (
        <div className="fixed w-46 left-5 top-17 z-50 rounded-xl bg-white/30 px-4 py-3 shadow-md">
          <button className="block w-full text-left text-neutral-900" onClick={() => setMenuOpen(false)}>Search</button>
          <button className="block w-full text-left text-neutral-900" onClick={() => setMenuOpen(false)}>Recent</button>
          <button className="block w-full text-left text-neutral-900" onClick={() => setMenuOpen(false)}>Write</button>
          <button className="block w-full text-left text-neutral-900" onClick={() => setMenuOpen(false)}>View</button>
          <button className="block w-full text-left text-neutral-900" onClick={() => setMenuOpen(false)}>Kyu.Log→</button>
        </div>
      )}
      <div
        className="relative bg-white"
        style={{
          width: '3840px',
          height: '2160px',
          backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {memos.map((memo) => <MemoCard key={memo.id} memo={memo} />)}
      </div>
    </main>
  );
}
