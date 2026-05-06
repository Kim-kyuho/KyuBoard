"use client";

import PressableButton from "./PressableButton";
import { Dispatch, SetStateAction } from "react";
import { Camera, ChevronLeft, ChevronRight, Search, SquarePen, SlidersHorizontal } from "lucide-react";

type BoardToolBarProps = {
    setMenuOpen: Dispatch<SetStateAction<boolean>>;
    setWriteClicked: Dispatch<SetStateAction<boolean>>;
    canEditMemos: boolean;
    onFocusPrevMemo: () => void;
    onFocusNextMemo: () => void;
    onZoomControlOpen: () => void;
    onPermissionDenied: () => void;
};

export default function BoardToolBar({ 
    setMenuOpen,
    setWriteClicked, 
    canEditMemos,
    onFocusPrevMemo,
    onFocusNextMemo,
    onZoomControlOpen,
    onPermissionDenied
}: BoardToolBarProps){
    return (
        <>
        <div 
            className = "board-toolbar fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-3 shadow-md" >
            {/* 이전 메모 이동 버튼 */}
            <PressableButton 
                variant="menu"
                onClick={() => {
                    onFocusPrevMemo();
                    setMenuOpen(false);
                }}
            >
                <ChevronLeft />
            </PressableButton>
            {/* Search버튼: 메모를 검색하는 기능 */}
            <PressableButton 
                variant="menu"
                onClick={() => setMenuOpen(false)}
            >
                <Search />
            </PressableButton>
            {/* Write버튼: 새로운 메모를 작성하는 기능 */}
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
            {/* ScreenShot버튼: 사진을 올리는 기능 */}
            <PressableButton 
                variant="menu"
                onClick={() => setMenuOpen(false)}
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
            {/* 다음 메모 이동 버튼 */}
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
