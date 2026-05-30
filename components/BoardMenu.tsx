"use client";

import PressableButton from "./PressableButton";
import { Dispatch, SetStateAction } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";
import { CurrentUser } from "@/hooks/useBoardAuth";

type BoardMenuProps = {
    menuOpen: boolean;
    setMenuOpen: Dispatch<SetStateAction<boolean>>;
    setSignInOpen: Dispatch<SetStateAction<boolean>>;
    setSignUpOpen: Dispatch<SetStateAction<boolean>>;
    currentUser: CurrentUser | null;
    onSignOut: () => void;
};

export default function BoardMenu( 
{
    menuOpen, 
    setMenuOpen, 
    setSignInOpen, 
    setSignUpOpen, 
    currentUser,
    onSignOut,
}: BoardMenuProps) {
    return(
        <>
        <div className="fixed left-5 top-5 z-50 rounded-xl text-neutral-900 px-4 py-3 shadow-md" >
            <Link
            href="/"
            className="transition duration-300 active:scale-105 active:rotate-1 text-sky-500 hover:text-pink-500 font-mono text-1xl sm:text-1xl font-extrabold"
            >
                •kyu.board
            </Link>
        </div>
            <PressableButton 
                className="fixed left-38 top-5 z-50 bg-white/30 px-4 py-3 shadow-md" 
                onClick={() => setMenuOpen((prev) => !prev)}>
                <Menu className="w-5 h-5 text-neutral-900 " />
            </PressableButton>
            {menuOpen && (
                    <div className="fixed w-46 left-5 top-17 z-50 rounded-xl bg-white/30 px-4 py-3 shadow-md">
                    <PressableButton 
                        variant="menu"
                        onClick={() => setMenuOpen(false)}>
                        Kyu.Log→
                    </PressableButton>
                    {currentUser ? (
                        <div className="mt-3 border-t border-white/50 pt-3">
                        <p className="mb-2 truncate px-2 text-sm font-semibold text-neutral-800">
                            [{currentUser.role}] {currentUser.email}
                        </p>
                        <PressableButton
                            className="px-2 py-1 text-sm font-semibold text-sky-600 hover:text-sky-500"
                            onClick={onSignOut}>
                            Sign-out
                        </PressableButton>
                        </div>
                    ) : (
                        <div className="mt-3 flex items-center justify-between border-t border-white/50 pt-3">
                        <PressableButton
                            className="px-2 py-1 text-sm font-semibold text-sky-600 hover:text-sky-500"
                            onClick={() => {
                            setMenuOpen(false);
                            setSignInOpen(true);
                            }}>
                            Sign-in
                        </PressableButton>
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
    )
}
