"use client";

import PressableButton from "./PressableButton";
import Link from "next/link";
import { Dispatch, SetStateAction } from "react";
import { Menu } from "lucide-react";

type CurrentUser = {
    email: string;
    permissionFlg: boolean;
    role: string;
}
type BoardToolBarProps = {
    menuOpen: boolean;
    setMenuOpen: Dispatch<SetStateAction<boolean>>;
    setSignInOpen: Dispatch<SetStateAction<boolean>>;
    setSignUpOpen: Dispatch<SetStateAction<boolean>>;
    setWriteClicked: Dispatch<SetStateAction<boolean>>;
    handleSignOut: () => void;
    currentUser: CurrentUser | null;
    canEditMemos: boolean;
    showPermissionMessage: () => void;
    
};

export default function BoardToolBar({
    menuOpen, 
    setMenuOpen, 
    setSignInOpen, 
    setSignUpOpen, 
    setWriteClicked, 
    handleSignOut,
    currentUser,
    canEditMemos,
    showPermissionMessage
}: BoardToolBarProps){
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
        <PressableButton 
            className="fixed left-38 top-5 z-50 bg-white/30 px-4 py-3 shadow-md" 
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
        </>
    );
}