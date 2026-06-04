"use client";

import { Ref } from "react";
import PressableButton from "./PressableButton";

interface ImageContextMenuProps {
    ref?: Ref<HTMLDivElement>;
    contextMenuPosition: { x: number; y: number };
    onDelete: () => void;
}

export default function ImageContextMenu({
    ref,
    contextMenuPosition,
    onDelete,
}: ImageContextMenuProps) {
    return (
        <div
            ref={ref}
            className="fixed z-50 rounded-md bg-white px-3.5 py-px shadow-md"
            style={{
                left: `${contextMenuPosition.x - 90}px`,
                top: `${contextMenuPosition.y - 70}px`,
            }}
        >
            <PressableButton variant="menu" onClick={onDelete}>
                Delete
            </PressableButton>
        </div>
    );
}
