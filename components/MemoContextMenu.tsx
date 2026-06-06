"use client";

import { Ref } from "react";
import { useMemoContextMenu } from "@/hooks/useMemoContextMenu";
import PressableButton from "./PressableButton";

interface MemoContextMenuProps {
    ref?: Ref<HTMLDivElement>;
    contextMenuPosition: { x: number; y: number };
    zoom: number;
    isEditing?: boolean;
    onChangeColor: (color: string) => void;
    onDelete: () => void;
}

export default function MemoContextMenu({
    ref,
    contextMenuPosition,
    zoom,
    isEditing,
    onChangeColor,
    onDelete,
}: MemoContextMenuProps) {
    const {
        memoColors,
        openMemoColorMenu,
        toggleColorMenu,
        handleColorSelect,
        // InputCodeBlock,
    } = useMemoContextMenu({ onChangeColor });

    return (
        <div
            ref={ref}
            className="fixed z-50 rounded-md bg-white px-3.5 py-px shadow-md"
            style={{
                left: `${contextMenuPosition.x}px`,
                top: `${contextMenuPosition.y}px`,
                transform: `scale(${1 / zoom})`,
                transformOrigin: "top left",
            }}
        >
            {isEditing && (
                <PressableButton variant="menu" onClick={toggleColorMenu}>
                    Memo Color &gt;
                </PressableButton>
            )}
            {openMemoColorMenu && (
                <div className="absolute left-40 top-0 mt-3 flex w-32 flex-col gap-2 rounded-md bg-white px-2 py-2 shadow-md">
                    {memoColors.map((color) => (
                        <button
                            key={color.value}
                            type="button"
                            title={color.name}
                            className="flex items-center gap-2 rounded-md px-2 py-1.5
                                    text-left transition duration-150 ease-out
                                    hover:bg-neutral-100 hover:shadow-sm
                                    active:scale-[0.97] active:bg-neutral-200
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
                            onClick={() => handleColorSelect(color.value)}
                        >
                            <span
                            className="h-6 w-6 rounded-full border border-neutral-300"
                            style={{ backgroundColor: color.value }}
                            />
                            <span className="text-xs text-neutral-700">
                            {color.value}
                            </span>
                        </button>
                        
                    ))}
                </div>
            )}
            {/* <PressableButton variant="menu" onClick={InputCodeBlock}>
                Code Block
            </PressableButton> */}
            <PressableButton variant="menu" onClick={onDelete}>
                Delete
            </PressableButton>
        </div>
    );
}
