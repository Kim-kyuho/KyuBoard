"use client";

import { Ref } from "react";
import { BringToFront, SendToBack, Trash2 } from "lucide-react";
import PressableButton from "./PressableButton";

interface MermaidActionMenuProps {
    ref?: Ref<HTMLDivElement>;
    zoom: number;
    onBringToFront?: () => void;
    onSendToBack?: () => void;
    onDelete: () => void;
}

export default function MermaidActionMenu({
    ref,
    zoom,
    onBringToFront,
    onSendToBack,
    onDelete,
}: MermaidActionMenuProps) {
    return (
        <div
            ref={ref}
            className="mermaid-action-menu absolute right-2 top-11 z-[50000] rounded-md bg-white px-3.5 py-px shadow-md"
            style={{
                transform: `scale(${0.8 / zoom})`,
                transformOrigin: "top right",
            }}
        >
            <PressableButton
                variant="menu"
                onClick={onBringToFront}
            >
                <span className="flex w-full items-center gap-2">
                    <BringToFront className="h-4 w-4" />
                    <span>Bring to Front</span>
                </span>
            </PressableButton>
            <PressableButton
                variant="menu"
                onClick={onSendToBack}
            >
                <span className="flex w-full items-center gap-2">
                    <SendToBack className="h-4 w-4" />
                    <span>Send to Back</span>
                </span>
            </PressableButton>
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
