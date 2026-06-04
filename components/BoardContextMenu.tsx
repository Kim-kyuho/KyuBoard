"use client";

import { Ref } from "react";
import PressableButton from "./PressableButton";

interface BoardContextMenuProps {
    ref?: Ref<HTMLDivElement>;
    contextMenuPosition: { x: number; y: number };
    onDelete: () => void;
}

export default function BoardContextMenu({
    ref,
    contextMenuPosition,
    onDelete,
}: BoardContextMenuProps) {
    return (
        <div
            ref={ref}
            className="fixed bg-white px-3 py-4 shadow-md"
            style={{
                left: `${contextMenuPosition.x}px`,
                top: `${contextMenuPosition.y}px`,
                zIndex: 65,
            }}
        >
            <PressableButton variant="menu" onClick={onDelete}>
                Delete
            </PressableButton>
        </div>
    );
}
