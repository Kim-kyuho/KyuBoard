"use client";

import PressableButton from "./PressableButton";
import { Dispatch, SetStateAction } from "react";
import { Camera, ChevronLeft, ChevronRight, Search, SquarePen, SlidersHorizontal } from "lucide-react";

type BoardToolBarProps = {
    setMenuOpen: Dispatch<SetStateAction<boolean>>;
    setSearchBarOpen: Dispatch<SetStateAction<boolean>>;
    setWriteClicked: Dispatch<SetStateAction<boolean>>;
    canEditMemos: boolean;
    onFocusPrevMemo: () => void;
    onFocusNextMemo: () => void;
    onZoomControlOpen: () => void;
    onImageUploadClick: () => void;
    onPermissionDenied: () => void;
};

export default function BoardToolBar({ 
    setMenuOpen,
    setSearchBarOpen,
    setWriteClicked, 
    canEditMemos,
    onFocusPrevMemo,
    onFocusNextMemo,
    onZoomControlOpen,
    onImageUploadClick,
    onPermissionDenied
}: BoardToolBarProps){
    return (
        <>
        <div 
            className = "board-toolbar fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-3 shadow-md" >
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

        </>
    );
}
