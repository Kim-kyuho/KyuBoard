"use client";

import PressableButton from "./PressableButton";
import { Dispatch, SetStateAction } from "react";
import { EllipsisIcon } from "lucide-react";
import Link from "next/link";
import { CurrentUser } from "@/hooks/useBoardAuth";

type BoardMenuProps = {
    menuOpen: boolean;
    currentBoard?: {
        title: string;
    };
    setMenuOpen: Dispatch<SetStateAction<boolean>>;
    setSignInOpen: Dispatch<SetStateAction<boolean>>;
    setSignUpOpen: Dispatch<SetStateAction<boolean>>;
    currentUser: CurrentUser | null;
    onSignOut: () => void;
};

export default function BoardMenu( 
{
    menuOpen, 
    currentBoard,
    setMenuOpen, 
    setSignInOpen, 
    setSignUpOpen, 
    currentUser,
    onSignOut,
}: BoardMenuProps) {
    return(
        <>
        <div className="fixed left-5 top-5 z-[50000] rounded-xl bg-white/75 text-neutral-900 px-4 py-3 shadow-md" >
            <Link
                href="/"
                className="transition duration-300 active:scale-105 active:rotate-1 text-sky-500 hover:text-pink-500 font-mono text-1xl sm:text-1xl font-extrabold"
                style={{
                    // iPad(혹은 다른 터치 디바이스)에서 원치않는 텍스트 선택 방지
                    WebkitTouchCallout: "none",
                    WebkitUserSelect: "none",
                    userSelect: "none",
                }}
            >
                •kyu.board
            </Link>
        </div>
            <PressableButton 
                className="fixed right-5 top-5 z-[50000] bg-white/75 px-3 py-3 shadow-md" 
                onClick={() => setMenuOpen((prev) => !prev)}>
                <EllipsisIcon className="w-5 h-5 text-neutral-900 " />
            </PressableButton>
            {menuOpen && (
                <div className="fixed w-50 right-5 top-17 z-[50000] rounded-xl bg-white/75 px-2 py-3 shadow-md">
                    {currentBoard?.title && (
                        <PressableButton 
                            variant="menu"
                            onClick={() => setMenuOpen(false)}>
                            <span className="font-bold">
                                {currentBoard.title}
                            </span>
                        </PressableButton>
                    )}
                    {currentUser ? (
                        <div className="border-t border-white/75">
                            <p className="mb-2 truncate px-2 text-sm font-semibold text-neutral-800">
                                [{currentUser.role}]<br/> 
                                <span className="block max-w-40 whitespace-normal break-all">
                                    {currentUser.email}
                                </span>
                            </p>
                            <PressableButton
                                className="px-2 py-1 text-sm font-semibold text-red-500 hover:text-sky-500"
                                onClick={onSignOut}>
                                Sign-out
                            </PressableButton>
                        </div>
                    ) : (
                        <div className="flex items-center justify-baseline border-t border-white/75">
                            <PressableButton
                                className="px-5 py-1 text-sm font-semibold text-sky-600 hover:text-rose-500"
                                onClick={() => {
                                setMenuOpen(false);
                                setSignInOpen(true);
                                }}>
                                Sign-in
                            </PressableButton>
                            <PressableButton
                                className="px-5 py-1 text-sm font-semibold text-indigo-500 hover:text-rose-500"
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
    )
}
