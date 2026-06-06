"use client";

import { Ref } from "react";
import PressableButton from "./PressableButton";

interface ImageContextMenuProps {
    ref?: Ref<HTMLDivElement>;
    contextMenuPosition: { x: number; y: number };
    zoom: number;
    onDelete: () => void;
}

export default function ImageContextMenu({
    ref,
    contextMenuPosition,
    zoom,
    onDelete,
}: ImageContextMenuProps) {
    return (
        <div
            ref={ref}
            className="fixed z-50 rounded-md bg-white px-3.5 py-px shadow-md"
            style={{
                left: `${contextMenuPosition.x}px`,
                top: `${contextMenuPosition.y}px`,
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
