"use client";

import { Ref } from "react";
import PressableButton from "./PressableButton";

interface ImageActionMenuProps {
    ref?: Ref<HTMLDivElement>;
    actionMenuPosition: { x: number; y: number };
    zoom: number;
    onDelete: () => void;
}

export default function ImageActionMenu({
    ref,
    actionMenuPosition,
    zoom,
    onDelete,
}: ImageActionMenuProps) {
    return (
        <div
            ref={ref}
            className="fixed z-50 rounded-md bg-white px-3.5 py-px shadow-md"
            style={{
                left: `${actionMenuPosition.x -130}px`,
                top: `${actionMenuPosition.y}px`,
                transform: `scale(${0.8 / zoom})`,
                transformOrigin: "top left",
            }}
        >
            <PressableButton variant="menu" onClick={onDelete}>
                Delete
            </PressableButton>
        </div>
    );
}
