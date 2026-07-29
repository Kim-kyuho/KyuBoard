"use client";

import { PointerEvent as ReactPointerEvent, useRef, useState } from "react";
import {
    BoardStroke,
    StrokePoint,
    eraserScreenRadius,
    strokeToPath,
} from "@/lib/board-stroke";
import type { DrawingTool } from "@/hooks/useBoardDrawing";
import { ACTIVE_CARD_Z } from "@/lib/zIndex";

type DrawingLayerProps = {
    strokes: BoardStroke[];
    drawingMode: boolean;
    drawingTool: DrawingTool;
    penColor: string;
    penWidth: number;
    zoom: number;
    onStrokeEnd: (points: StrokePoint[]) => void;
    onErase: (start: StrokePoint, end: StrokePoint, radius: number) => void;
};

function StrokePaths({ strokes }: { strokes: BoardStroke[] }) {
    return (
        <>
            {strokes.map((stroke) => (
                <path
                    key={stroke.id}
                    d={strokeToPath(stroke.points)}
                    stroke={stroke.color}
                    strokeWidth={stroke.width}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ))}
        </>
    );
}

export default function DrawingLayer({
    strokes,
    drawingMode,
    drawingTool,
    penColor,
    penWidth,
    zoom,
    onStrokeEnd,
    onErase,
}: DrawingLayerProps) {
    const layerRef = useRef<SVGSVGElement | null>(null);
    const activePointerRef = useRef<number | null>(null);
    const currentPointsRef = useRef<StrokePoint[]>([]);
    const previousEraserPointRef = useRef<StrokePoint | null>(null);
    const [currentPoints, setCurrentPoints] = useState<StrokePoint[]>([]);
    const [eraserPoint, setEraserPoint] = useState<StrokePoint | null>(null);

    const eraserRadius = eraserScreenRadius / zoom;
    const capturesInput = drawingTool !== "pan";

    if (!drawingMode) {
        return (
            <svg
                pointerEvents="none"
                aria-hidden="true"
                className="absolute left-0 top-0 h-full w-full"
                style={{
                    zIndex: ACTIVE_CARD_Z - 1,
                    pointerEvents: "none",
                    WebkitTouchCallout: "none",
                    WebkitUserSelect: "none",
                    userSelect: "none",
                }}
            >
                <StrokePaths strokes={strokes} />
            </svg>
        );
    }

    const toBoardPoint = (event: ReactPointerEvent<SVGSVGElement>): StrokePoint => {
        const layerRect = layerRef.current?.getBoundingClientRect();

        if (!layerRect) {
            return [0, 0];
        }

        return [
            (event.clientX - layerRect.left) / zoom,
            (event.clientY - layerRect.top) / zoom,
        ];
    };

    const finishCurrentStroke = () => {
        const points = currentPointsRef.current;
        activePointerRef.current = null;
        currentPointsRef.current = [];

        if (points.length > 1) {
            onStrokeEnd(points);
        }

        setCurrentPoints([]);
    };

    const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
        if (!capturesInput || (event.pointerType === "touch" && !event.isPrimary)) {
            return;
        }

        event.preventDefault();

        if (activePointerRef.current !== null) {
            finishCurrentStroke();
        }

        const boardPoint = toBoardPoint(event);
        activePointerRef.current = event.pointerId;

        if (drawingTool === "erase") {
            previousEraserPointRef.current = boardPoint;
            setEraserPoint(boardPoint);
            onErase(boardPoint, boardPoint, eraserRadius);
            return;
        }

        currentPointsRef.current = [boardPoint];
        setCurrentPoints([boardPoint]);
    };

    const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
        if (!capturesInput) {
            return;
        }

        const boardPoint = toBoardPoint(event);
        const pressed = event.buttons !== 0 || (event.pointerType === "pen" && event.pressure > 0);

        if (drawingTool === "erase") {
            setEraserPoint(boardPoint);

            if (activePointerRef.current === event.pointerId && pressed) {
                const previousPoint = previousEraserPointRef.current ?? boardPoint;
                onErase(previousPoint, boardPoint, eraserRadius);
                previousEraserPointRef.current = boardPoint;
            }

            return;
        }

        if (activePointerRef.current !== event.pointerId) {
            return;
        }

        if (!pressed) {
            finishCurrentStroke();
            return;
        }

        const nextPoints = [...currentPointsRef.current, boardPoint];
        currentPointsRef.current = nextPoints;
        setCurrentPoints(nextPoints);
    };

    const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
        const wasDrawing = activePointerRef.current === event.pointerId;

        if (!wasDrawing) {
            return;
        }

        if (drawingTool === "erase") {
            activePointerRef.current = null;
            previousEraserPointRef.current = null;
            return;
        }

        finishCurrentStroke();
    };

    return (
        <svg
            ref={layerRef}
            data-drawing-capture={capturesInput ? "true" : undefined}
            className="absolute left-0 top-0 h-full w-full"
            style={{
                zIndex: ACTIVE_CARD_Z - 1,
                pointerEvents: "auto",
                touchAction: capturesInput ? "none" : undefined,
                cursor: capturesInput ? "crosshair" : undefined,
                WebkitTouchCallout: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={() => setEraserPoint(null)}
        >
            <StrokePaths strokes={strokes} />
            {currentPoints.length > 0 && (
                <path
                    d={strokeToPath(currentPoints)}
                    stroke={penColor}
                    strokeWidth={penWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}
            {drawingTool === "erase" && eraserPoint && (
                <circle
                    cx={eraserPoint[0]}
                    cy={eraserPoint[1]}
                    r={eraserRadius}
                    fill="#ffffff"
                    stroke="#a3a3a3"
                    strokeWidth={1 / zoom}
                />
            )}
        </svg>
    );
}
