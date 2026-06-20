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
    const toolbarButtonClassName = "flex h-10 w-10 items-center justify-center px-0 py-0 hover:pl-0 hover:bg-white/80 hover:shadow-sm active:scale-90 active:bg-white active:shadow-inner";
    const toolbarIconClassName = "h-5 w-5 transition duration-150 ease-out";

    return (
        <>
        {showBoardToolBar && (
        <div
            className="board-toolbar fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-0 bg-white/75 rounded-xl px-2 py-1 shadow-md"
        >
            <PressableButton 
                variant="menu"
                className={toolbarButtonClassName}
                onClick={() => {
                    onFocusPrevMemo();
                    setMenuOpen(false);
                }}
            >
                <ChevronLeft className={toolbarIconClassName} />
            </PressableButton>
            <PressableButton 
                variant="menu"
                className={toolbarButtonClassName}
                onClick={() => {
                    setMenuOpen(false);
                    setSearchBarOpen(prev => !prev);
                    }    
                }
            >
                <Search className={toolbarIconClassName} />
            </PressableButton>
            <PressableButton 
                variant="menu"
                className={toolbarButtonClassName}
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
                <SquarePen className={toolbarIconClassName} />
            </PressableButton>
            <PressableButton 
                variant="menu"
                className={toolbarButtonClassName}
                onClick={() => {
                    onImageUploadClick();
                    setMenuOpen(false);
                }}
            >
                <Camera className={toolbarIconClassName} />
            </PressableButton>
            <PressableButton
                variant="menu"
                className={toolbarButtonClassName}
                onClick={() => {
                    onMermaidCreateClick();
                    setMenuOpen(false);
                }}
            >
                <Workflow className={toolbarIconClassName} />
            </PressableButton>
            <PressableButton
                variant="menu"
                className={toolbarButtonClassName}
                onClick={() => {
                    onZoomControlOpen();
                    setMenuOpen(false);
                }}
            >
                <SlidersHorizontal className={toolbarIconClassName}/>
            </PressableButton>
            <PressableButton
                variant="menu"
                className={toolbarButtonClassName}
                onClick={() => {
                    onFocusNextMemo();
                    setMenuOpen(false);
                }}
            >
                <ChevronRight className={toolbarIconClassName} />
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
