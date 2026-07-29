"use client";

import { useState } from "react";
import { Check, Eraser, Minus, Palette, Undo2 } from "lucide-react";
import { penColors, penWidths } from "@/lib/board-stroke";
import { CardToolButton, CardToolPortal } from "./CardToolPortal";

type DrawingToolBarProps = {
    penColor: string;
    penWidth: number;
    onChangeColor: (color: string) => void;
    onChangeWidth: (width: number) => void;
    onUndo: () => void;
    onClear: () => void;
    onDone: () => void;
};

// 그리기 모드일 때 메인 툴바를 대신하는 도구 모음
// 카드 툴바들과 같은 자리(#card-tool-portal)에 같은 방식으로 나타난다
export default function DrawingToolBar({
    penColor,
    penWidth,
    onChangeColor,
    onChangeWidth,
    onUndo,
    onClear,
    onDone,
}: DrawingToolBarProps) {
    const [openColorMenu, setOpenColorMenu] = useState(false);
    const [openWidthMenu, setOpenWidthMenu] = useState(false);

    const toggleColorMenu = () => {
        setOpenColorMenu((prev) => !prev);
        setOpenWidthMenu(false);
    };

    const toggleWidthMenu = () => {
        setOpenWidthMenu((prev) => !prev);
        setOpenColorMenu(false);
    };

    const handleColorSelect = (color: string) => {
        onChangeColor(color);
        setOpenColorMenu(false);
    };

    const handleWidthSelect = (width: number) => {
        onChangeWidth(width);
        setOpenWidthMenu(false);
    };

    return (
        <CardToolPortal>
            <div className="relative">
                <CardToolButton label="Pen color" onClick={toggleColorMenu}>
                    <Palette style={{ color: penColor }} />
                </CardToolButton>
                {openColorMenu && (
                    <div className="absolute right-full top-0 mr-2 flex items-center gap-1 rounded-md bg-white p-1 shadow-md">
                        {penColors.map((color) => (
                            <button
                                key={color.value}
                                type="button"
                                aria-label={color.name}
                                title={color.name}
                                className="h-8 w-8 rounded-full border border-neutral-300 transition hover:scale-105 active:scale-95"
                                style={{ backgroundColor: color.value }}
                                onClick={() => handleColorSelect(color.value)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="relative">
                <CardToolButton label="Pen width" onClick={toggleWidthMenu}>
                    <Minus strokeWidth={penWidth} />
                </CardToolButton>
                {openWidthMenu && (
                    <div className="absolute right-full top-0 mr-2 flex items-center gap-1 rounded-md bg-white p-1 shadow-md">
                        {penWidths.map((width) => (
                            <CardToolButton
                                key={width.value}
                                label={width.name}
                                onClick={() => handleWidthSelect(width.value)}
                            >
                                <Minus strokeWidth={width.value} />
                            </CardToolButton>
                        ))}
                    </div>
                )}
            </div>

            <CardToolButton label="Undo last stroke" onClick={onUndo}>
                <Undo2 />
            </CardToolButton>
            <CardToolButton label="Clear all strokes" onClick={onClear} className="text-rose-600">
                <Eraser />
            </CardToolButton>
            <CardToolButton label="Finish drawing" onClick={onDone}>
                <Check />
            </CardToolButton>
        </CardToolPortal>
    );
}
