"use client";

import { useEffect, useRef, useState } from "react";
import mermaidRenderer from "mermaid";
import { Rnd } from "react-rnd";
import { Trash2 } from "lucide-react";
import PressableButton from "./PressableButton";
import { MermaidCardMermaid, useMermaidCard } from "@/hooks/useMermaidCard";
import ConfirmDialog from "@/components/ConfirmDialog";

type MermaidCardProps = {
    mermaid: MermaidCardMermaid;
    zoom: number;
    canEdit: boolean;
    onPermissionDenied: () => void;
    onUpdate: (
        id: number,
        boardId: number,
        source: string,
        x: number,
        y: number,
        width: number,
        height: number,
    ) => void;
    onInsert: (
        tempId: number,
        boardId: number,
        source: string,
        x: number,
        y: number,
        width: number,
        height: number,
    ) => void;
    onDelete: (id: number) => void;
};

let mermaidRenderIndex = 0;

mermaidRenderer.initialize({
    startOnLoad: false,
    securityLevel: "strict",
});

const makeMermaidSvgResponsive = (svg: string) =>
    svg
        .replace(/\swidth="[^"]*"/, "")
        .replace(/\sheight="[^"]*"/, "")
        .replace("<svg", "<svg preserveAspectRatio=\"xMidYMid meet\"");

export default function MermaidCard({
    mermaid,
    zoom,
    canEdit,
    onPermissionDenied,
    onInsert,
    onUpdate,
    onDelete,
}: MermaidCardProps) {
    const {
        cardState,
        source,
        setSource,
        isEditing,
        isResizing,
        deleteDialogOpen,
        dragHandlePressed,
        setDragHandlePressed,
        editMermaid,
        handleDoubleTap,
        handleMermaidPress,
        handleDragStop,
        handleResizeStart,
        handleResizeStop,
        openDeleteDialog,
        closeDeleteDialog,
        confirmDelete,
    } = useMermaidCard({
        mermaid,
        canEdit,
        onPermissionDenied,
        onInsert,
        onUpdate,
        onDelete,
    });
    const [svg, setSvg] = useState("");
    const [renderError, setRenderError] = useState("");
    const renderTicketRef = useRef(0);

    useEffect(() => {
        const renderTicket = renderTicketRef.current + 1;
        renderTicketRef.current = renderTicket;

        if (!source.trim()) {
            void Promise.resolve().then(() => {
                if (renderTicketRef.current !== renderTicket) {
                    return;
                }

                setSvg("");
                setRenderError("");
            });
            return;
        }

        const renderId = `kyuboard-mermaid-${Math.abs(mermaid.id)}-${mermaidRenderIndex++}`;

        mermaidRenderer
            .render(renderId, source)
            .then(({ svg }) => {
                if (renderTicketRef.current !== renderTicket) {
                    return;
                }

                setSvg(makeMermaidSvgResponsive(svg));
                setRenderError("");
            })
            .catch((error) => {
                if (renderTicketRef.current !== renderTicket) {
                    return;
                }

                setSvg("");
                setRenderError(error instanceof Error ? error.message : "Mermaid syntax error.");
            });
    }, [mermaid.id, source]);

    return (
        <>
            <Rnd
                data-editing={isEditing}
                className={`mermaid-rnd-${mermaid.id} select-none rounded-xl ${isEditing ? "ring-2 ring-pink-400 ring-offset-2" : ""}`}
                default={{
                    x: mermaid.x,
                    y: mermaid.y,
                    width: mermaid.width,
                    height: mermaid.height,
                }}
                position={{
                    x: cardState.x,
                    y: cardState.y,
                }}
                size={{
                    width: cardState.width,
                    height: cardState.height,
                }}
                bounds="parent"
                scale={zoom}
                dragHandleClassName="mermaid-drag-handle"
                disableDragging={!isEditing || !canEdit}
                enableResizing={isEditing}
                onDragStop={handleDragStop}
                onResizeStart={handleResizeStart}
                onResizeStop={handleResizeStop}
            >
                <div
                    className="relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-white shadow-md"
                    onClick={handleMermaidPress}
                    onDoubleClick={editMermaid}
                    onPointerDown={handleDoubleTap}
                >
                    {isEditing && (
                        <div className="flex items-center justify-end border-b border-neutral-200 bg-neutral-50 px-2 py-1">
                            <PressableButton
                                variant="menu"
                                onClick={openDeleteDialog}
                            >
                                <span className="flex items-center gap-2 text-rose-600">
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete</span>
                                </span>
                            </PressableButton>
                        </div>
                    )}

                    {isEditing && (
                        <textarea
                            value={source}
                            onChange={(event) => setSource(event.target.value)}
                            className="h-2/5 min-h-24 resize-none border-b border-neutral-200 bg-neutral-50 p-3 font-mono text-sm text-neutral-900 outline-none"
                            spellCheck={false}
                        />
                    )}

                    <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3">
                        {renderError ? (
                            <pre className="w-full whitespace-pre-wrap rounded-md bg-rose-50 p-3 text-xs text-rose-700">
                                {renderError}
                            </pre>
                        ) : svg ? (
                            <div
                                className="mermaid-rendered h-full w-full"
                                dangerouslySetInnerHTML={{ __html: svg }}
                            />
                        ) : (
                            <div className="text-sm text-neutral-400">Mermaid source is empty.</div>
                        )}
                    </div>

                    {isEditing && (
                        <div
                            className="mermaid-drag-handle absolute bottom-2 left-1/2 z-10 flex h-5 w-24 -translate-x-1/2 cursor-grab items-center justify-center rounded-full active:cursor-grabbing"
                            onPointerDown={() => setDragHandlePressed(true)}
                            onPointerUp={() => setDragHandlePressed(false)}
                            onPointerCancel={() => setDragHandlePressed(false)}
                            onPointerLeave={() => setDragHandlePressed(false)}
                        >
                            <div className={`h-1.5 w-24 rounded-full transition duration-150 ${dragHandlePressed ? "bg-black/70" : "bg-black/25"}`} />
                        </div>
                    )}

                    {isResizing && (
                        <div className="pointer-events-none absolute inset-0 z-20 animate-pulse rounded-xl border-2 border-dashed border-pink-500" />
                    )}
                </div>
            </Rnd>

            {deleteDialogOpen && (
                <ConfirmDialog
                    message="Delete this mermaid?"
                    onConfirm={confirmDelete}
                    onCancel={closeDeleteDialog}
                />
            )}
        </>
    );
}
