"use client";

import { Ref } from "react";
import { Trash2 } from "lucide-react";
import PressableButton from "./PressableButton";

interface MermaidActionMenuProps {
    ref?: Ref<HTMLDivElement>;
    zoom: number;
    onDelete: () => void;
}

export default function MermaidActionMenu({
    ref,
    zoom,
    onDelete,
}: MermaidActionMenuProps) {
    return (
        <div
            ref={ref}
            className="mermaid-action-menu absolute right-2 top-11 z-50 rounded-md bg-white px-3.5 py-px shadow-md"
            style={{
                transform: `scale(${0.8 / zoom})`,
                transformOrigin: "top right",
            }}
        >
            <PressableButton
                variant="menu"
                onClick={onDelete}
            >
                <span className="flex w-full items-center gap-2 text-rose-600">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                </span>
            </PressableButton>
        </div>
    );
}
