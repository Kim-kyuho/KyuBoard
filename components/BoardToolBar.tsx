"use client";

import PressableButton from "./PressableButton";
import { Dispatch, SetStateAction } from "react";
import { Camera, ChevronLeft, ChevronRight, Search, SquarePen, Workflow } from "lucide-react";
import BoardZoomControl from "./BoardZoomControl";

type BoardToolBarProps = {
    cardEditing: boolean;
    boardZoom: number;
    setBoardZoom: Dispatch<SetStateAction<number>>;
    setMenuOpen: Dispatch<SetStateAction<boolean>>;
    setSearchBarOpen: Dispatch<SetStateAction<boolean>>;
    onFocusPrevMemo: () => void;
    onFocusNextMemo: () => void;
    onMemoCreateClick: () => void;
    onImageUploadClick: () => void;
    onMermaidCreateClick: () => void;
};

export default function BoardToolBar({ 
    cardEditing,
    boardZoom,
    setBoardZoom,
    setMenuOpen,
    setSearchBarOpen,
    onFocusPrevMemo,
    onFocusNextMemo,
    onMemoCreateClick,
    onImageUploadClick,
    onMermaidCreateClick
}: BoardToolBarProps){
    const toolbarButtonClassName = "flex h-10 w-10 items-center justify-center px-0 py-0 hover:pl-0 hover:bg-white/80 hover:shadow-sm active:scale-90 active:bg-white active:shadow-inner";
    const toolbarIconClassName = "h-5 w-5 transition duration-150 ease-out";

    return (
        <>
            {!cardEditing && (
            <div className="board-toolbar fixed bottom-16 right-5 z-[50000] flex flex-col items-end gap-1">
                <div className="flex flex-col items-center gap-0">
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
                            onFocusNextMemo();
                            setMenuOpen(false);
                        }}
                    >
                        <ChevronRight className={toolbarIconClassName} />
                    </PressableButton>
                </div>
                <div>
                    <PressableButton 
                        variant="menu"
                        className={toolbarButtonClassName}
                        onClick={() => {
                            setMenuOpen(false);
                            setSearchBarOpen(prev => !prev);
                        }}
                    >
                        <Search className={toolbarIconClassName} />
                    </PressableButton>
                </div>
                <div>
                    <PressableButton 
                        variant="menu"
                        className={toolbarButtonClassName}
                        onClick={() => { 
                            onMemoCreateClick();
                            setMenuOpen(false);
                        }}
                    >
                        <SquarePen className={toolbarIconClassName} />
                    </PressableButton>
                </div>
                <div>
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
                </div>
                <div>
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
                </div>
            </div>
            )}
            <BoardZoomControl
                boardZoom={boardZoom}
                setBoardZoom={setBoardZoom}
            />
        </>
    );
}
