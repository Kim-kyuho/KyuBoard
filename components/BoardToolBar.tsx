"use client";

import PressableButton from "./PressableButton";
import { Dispatch, SetStateAction } from "react";
import { Eye, EyeOff, Camera, ChevronLeft, ChevronRight, Search, SquarePen, SlidersHorizontal, Workflow } from "lucide-react";

type BoardToolBarProps = {
    showBoardToolBar: boolean;
    setShowBoardToolBar: Dispatch<SetStateAction<boolean>>;
    setMenuOpen: Dispatch<SetStateAction<boolean>>;
    setSearchBarOpen: Dispatch<SetStateAction<boolean>>;
    setWriteClicked: Dispatch<SetStateAction<boolean>>;
    canEditMemos: boolean;
    onFocusPrevMemo: () => void;
    onFocusNextMemo: () => void;
    onZoomControlOpen: () => void;
    onImageUploadClick: () => void;
    onMermaidCreateClick: () => void;
    onPermissionDenied: () => void;
};

export default function BoardToolBar({ 
    showBoardToolBar,
    setShowBoardToolBar,
    setMenuOpen,
    setSearchBarOpen,
    setWriteClicked, 
    canEditMemos,
    onFocusPrevMemo,
    onFocusNextMemo,
    onZoomControlOpen,
    onImageUploadClick,
    onMermaidCreateClick,
    onPermissionDenied
}: BoardToolBarProps){
    return (
        <>
        {showBoardToolBar && (
        <div
            className="board-toolbar fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-0 rounded-xl px-2 py-1 shadow-md"
        >
            <PressableButton 
                variant="menu"
                onClick={() => {
                    onFocusPrevMemo();
                    setMenuOpen(false);
                }}
            >
                <ChevronLeft />
            </PressableButton>
            <PressableButton 
                variant="menu"
                onClick={() => {
                    setMenuOpen(false);
                    setSearchBarOpen(prev => !prev);
                    }    
                }

            >
                <Search />
            </PressableButton>
            <PressableButton 
                variant="menu"
                onClick={() => { 
                    if (!canEditMemos) {
                        onPermissionDenied();
                        setMenuOpen(false);
                        return;
                    }
                    setWriteClicked(true);
                    setMenuOpen(false);
                }}
            >
                <SquarePen />
            </PressableButton>
            <PressableButton 
                variant="menu"
                onClick={() => {
                    onImageUploadClick();
                    setMenuOpen(false);
                }}
            >
                <Camera />
            </PressableButton>
            <PressableButton
                variant="menu"
                onClick={() => {
                    onMermaidCreateClick();
                    setMenuOpen(false);
                }}
            >
                <Workflow />
            </PressableButton>
            <PressableButton
                variant="menu"
                onClick={() => {
                    onZoomControlOpen();
                    setMenuOpen(false);
                }}
            >
                <SlidersHorizontal/>
            </PressableButton>
            <PressableButton
                variant="menu"
                onClick={() => {
                    onFocusNextMemo();
                    setMenuOpen(false);
                }}
            >
                <ChevronRight />
            </PressableButton>
        </div>
        )}

        <button
            type="button"
            className="board-toolbar fixed bottom-7 right-5 z-50 text-neutral-700 transition hover:text-neutral-950 active:scale-95"
            aria-label={showBoardToolBar ? "Hide board toolbar" : "Show board toolbar"}
            onClick={() => setShowBoardToolBar((prev) => !prev)}
        >
            {showBoardToolBar ? <EyeOff /> : <Eye />}
        </button>
        </>
    );
}
