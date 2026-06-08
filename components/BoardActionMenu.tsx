"use client";

import { Ref } from "react";
import { Trash2 } from "lucide-react";
import PressableButton from "./PressableButton";

interface BoardActionMenuProps {
    ref?: Ref<HTMLDivElement>;
    actionMenuPosition: { x: number; y: number };
    onDelete: () => void;
}

export default function BoardActionMenu({
    ref,
    actionMenuPosition,
    onDelete,
}: BoardActionMenuProps) {
    return (
        <div
            ref={ref}
            className="fixed rounded-md bg-white px-3.5 py-px shadow-md"
            style={{
                left: `${actionMenuPosition.x-120}px`,
                top: `${actionMenuPosition.y}px`,
                zIndex: 65,
            }}
        >
            <PressableButton variant="menu" onClick={onDelete}>
                <span className="flex w-full items-center gap-2 text-rose-600">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                </span>
            </PressableButton>
        </div>
    );
}
