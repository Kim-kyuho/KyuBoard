"use client";

import { Ref } from "react";
import { useMemoContextMenu } from "@/hooks/useMemoActionMenu";
import { ChevronDown, Palette, Code2, Quote, Trash2 } from "lucide-react";
import PressableButton from "./PressableButton";

interface MemoActionMenuProps {
    ref?: Ref<HTMLDivElement>;
    actionMenuPosition: { x: number; y: number };
    zoom: number;
    isEditing?: boolean;
    onChangeColor: (color: string) => void;
    onCodeBlock: () => void;
    onBlockQuote: () => void;
    onDelete: () => void;
}

export default function MemoActionMenu({
    ref,
    actionMenuPosition,
    zoom,
    isEditing,
    onChangeColor,
    onCodeBlock,
    onBlockQuote,
    onDelete,
}: MemoActionMenuProps) {
    const {
        memoColors,
        openMemoColorMenu,
        toggleColorMenu,
        handleColorSelect,
    } = useMemoContextMenu({ onChangeColor});

    return (
        <div
            ref={ref}
            className="fixed z-50 rounded-md bg-white px-3.5 py-px shadow-md"
            style={{
                left: `${actionMenuPosition.x}px`,
                top: `${actionMenuPosition.y}px`,
                transform: `scale(${0.8 / zoom})`,
                transformOrigin: "top left",
            }}
        >
            {isEditing && (
                 <>
                    <PressableButton variant="menu" onClick={toggleColorMenu}>
                        <span className="flex w-full items-center gap-2">
                            <Palette className="h-4 w-4" />
                            <span>Memo Color</span>
                            <span className="ml-auto">
                                <ChevronDown className="h-4 w-4" />
                            </span>
                        </span>
                    </PressableButton>
                    { openMemoColorMenu && (
                        <div className="my-1 flex w-36 flex-col gap-1 rounded-md bg-neutral-50 px-2 py-2 shadow-inner">
                            {memoColors.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    title={color.name}
                                    className="group relative flex items-center gap-2 overflow-hidden rounded-md px-2 py-1.5
                                            text-left transition duration-150 ease-out
                                            hover:bg-neutral-100 hover:shadow-sm
                                            active:scale-[0.97] active:bg-neutral-200
                                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
                                    onClick={() => handleColorSelect(color.value)}
                                >
                                    <span className="pointer-events-none absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-white/70 opacity-0 transition duration-300 ease-out group-active:scale-[8] group-active:opacity-100" />
                                    <span
                                        className="relative h-6 w-6 rounded-full border border-neutral-300"
                                        style={{ backgroundColor: color.value }}
                                    />
                                    <span className="relative text-xs text-neutral-700">
                                        {color.value}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                    <PressableButton variant="menu" onClick={onCodeBlock}>
                        <span className="flex w-full items-center gap-2">
                            <Code2 className="h-4 w-4" />
                            <span>Code Block</span>
                        </span>
                    </PressableButton>

                    <PressableButton variant="menu" onClick={onBlockQuote}>
                        <span className="flex w-full items-center gap-2">
                            <Quote className="h-4 w-4" />
                            <span>Block Quote</span>
                        </span>
                    </PressableButton>
                </>
            )}
            <PressableButton variant="menu" onClick={onDelete}>
                <span className="flex w-full items-center gap-2 text-rose-600">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                </span>
            </PressableButton>
        </div>
    );
}
