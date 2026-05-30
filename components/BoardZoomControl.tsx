"use client";

import { Dispatch, SetStateAction } from "react";

type BoardZoomControlProps ={
    boardZoom: number
    zoomOpen: boolean;
    zoomClosing: boolean;
    setBoardZoom: Dispatch<SetStateAction<number>>;
    onZoomControlOpen: () => void;
    onZoomControlStart: () => void;
    onZoomControlEnd: () => void;
}

export default function BoardZoomControl({
    boardZoom,
    zoomOpen,
    zoomClosing,
    setBoardZoom,
    onZoomControlOpen,
    onZoomControlStart,
    onZoomControlEnd,
}:BoardZoomControlProps){
    return(
        <>

        {zoomOpen && (
            <div className={`fixed right-5 bottom-25 z-50 flex items-center gap-2 transition-opacity duration-300 ${zoomClosing ? "opacity-0" : "opacity-100"}`}>
            <span className="text-xs font-semibold text-neutral-700">
                Zoom
            </span>
            <input
                className="w-32  accent-sky-500"
                type="range"
                min={0.25}
                max={2}
                step={0.05}
                value={boardZoom}
                onPointerDown={onZoomControlStart}
                onPointerUp={onZoomControlEnd}
                onPointerCancel={onZoomControlEnd}
                onFocus={onZoomControlStart}
                onBlur={onZoomControlEnd}
                onChange={(e) => {
                    setBoardZoom(Number(e.target.value));
                    onZoomControlOpen();
                }}
                aria-label="Board zoom"
            />

            <span className="text-xs font-semibold text-neutral-700">
                {Math.round(boardZoom * 100)}%
            </span>
        </div>
        )}    
        </>
    )
}
