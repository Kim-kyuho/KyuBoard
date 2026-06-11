"use client";

import { Ref } from "react";
import { useMemoActionMenu } from "@/hooks/useMemoActionMenu";
import { Bold, ChevronDown, Highlighter, Italic, Minus, Palette, Heading, Code2, Quote, Strikethrough, Trash2 } from "lucide-react";
import PressableButton from "./PressableButton";

interface MemoActionMenuProps {
    ref?: Ref<HTMLDivElement>;
    zoom: number;
    isEditing?: boolean;
    onChangeColor: (color: string) => void;
    onHeading: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
    onBold: () => void;
    onItalic: () => void;
    onStrike: () => void;
    onHorizontalRule: () => void;
    onHighlight: () => void;
    onCodeBlock: () => void;
    onBlockQuote: () => void;
    onDelete: () => void;
}

export default function MemoActionMenu({
    ref,
    zoom,
    isEditing,
    onChangeColor,
    onHeading,
    onBold,
    onItalic,
    onStrike,
    onHorizontalRule,
    onHighlight,
    onCodeBlock,
    onBlockQuote,
    onDelete,
}: MemoActionMenuProps) {
    const {
        memoColors,
        headingLevels,
        menuScrollRef,
        openMemoColorMenu,
        openHeadingMenu,
        showScrollHint,
        toggleColorMenu,
        toggleHeadingMenu,
        handleColorSelect,
        handleHeadingSelect,
        handleMenuScroll,
    } = useMemoActionMenu({ onChangeColor, onHeading });

    return (
        <div
            ref={ref}
            className="absolute right-2 top-11 z-50 overflow-hidden rounded-md bg-white shadow-md"
            style={{
                transform: `scale(${0.8 / zoom})`,
                transformOrigin: "top right",
            }}
        >
            <div
                ref={menuScrollRef}
                className="max-h-44 overflow-y-auto overscroll-contain px-3.5 py-1 pb-3"
                onScroll={handleMenuScroll}
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
                    <PressableButton variant="menu" onClick={toggleHeadingMenu}>
                        <span className="flex w-full items-center gap-2">
                            <Heading className="h-4 w-4" />
                            <span>Heading</span>
                            <span className="ml-auto">
                                <ChevronDown className="h-4 w-4" />
                            </span>
                        </span>
                    </PressableButton>
                    {openHeadingMenu && (
                        <div className="my-1 flex w-36 flex-col gap-1 rounded-md bg-neutral-50 px-2 py-2 shadow-inner">
                            {headingLevels.map((heading) => (
                                <button
                                    key={heading.value}
                                    type="button"
                                    className="group relative flex items-center gap-2 overflow-hidden rounded-md px-2 py-1.5
                                            text-left transition duration-150 ease-out
                                            hover:bg-neutral-100 hover:shadow-sm
                                            active:scale-[0.97] active:bg-neutral-200
                                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
                                    onClick={() => handleHeadingSelect(heading.value)}
                                >
                                    <span className="pointer-events-none absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-white/70 opacity-0 transition duration-300 ease-out group-active:scale-[8] group-active:opacity-100" />
                                    <Heading className="relative h-4 w-4 text-neutral-600" />
                                    <span className="relative text-xs text-neutral-700">
                                        {heading.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                    <PressableButton variant="menu" onClick={onBold}>
                        <span className="flex w-full items-center gap-2">
                            <Bold className="h-4 w-4" />
                            <span>Bold</span>
                        </span>
                    </PressableButton>

                    <PressableButton variant="menu" onClick={onItalic}>
                        <span className="flex w-full items-center gap-2">
                            <Italic className="h-4 w-4" />
                            <span>Italic</span>
                        </span>
                    </PressableButton>

                    <PressableButton variant="menu" onClick={onStrike}>
                        <span className="flex w-full items-center gap-2">
                            <Strikethrough className="h-4 w-4" />
                            <span>Strike</span>
                        </span>
                    </PressableButton>

                    <PressableButton variant="menu" onClick={onHighlight}>
                        <span className="flex w-full items-center gap-2">
                            <Highlighter className="h-4 w-4" />
                            <span>Highlight</span>
                        </span>
                    </PressableButton>

                    <PressableButton variant="menu" onClick={onHorizontalRule}>
                        <span className="flex w-full items-center gap-2">
                            <Minus className="h-4 w-4" />
                            <span>Divider</span>
                        </span>
                    </PressableButton>

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
            {showScrollHint && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex h-3 items-end justify-center rounded-b-md bg-linear-to-t from-white via-white/90 to-transparent pb-1 text-neutral-400">
                    <ChevronDown className="h-4 w-4" />
                </div>
            )}
        </div>
    );
}
