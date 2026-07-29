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
    onErase: (center: StrokePoint, radius: number) => void;
};

// 보드 위에 덮이는 획 레이어
// 카드들의 z 통합 정렬에 참여하지 않고 항상 최상단에 그려진다
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
    const [currentPoints, setCurrentPoints] = useState<StrokePoint[]>([]);
    const [eraserPoint, setEraserPoint] = useState<StrokePoint | null>(null);

    // 지우개는 화면 기준 크기를 유지해야 하므로 보드 좌표로 환산한다
    const eraserRadius = eraserScreenRadius / zoom;
    // 패닝 모드에서는 레이어가 입력을 가로채지 않아야 보드가 움직인다
    const capturesInput = drawingMode && drawingTool !== "pan";

    // 화면 좌표를 보드 좌표로 변환 - 메모 생성 위치를 boardZoom으로 나누는 것과 같은 규칙
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

    const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
        if (!capturesInput || activePointerRef.current !== null) {
            return;
        }

        const boardPoint = toBoardPoint(event);
        activePointerRef.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);

        if (drawingTool === "erase") {
            setEraserPoint(boardPoint);
            onErase(boardPoint, eraserRadius);
            return;
        }

        setCurrentPoints([boardPoint]);
    };

    const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
        if (!capturesInput) {
            return;
        }

        const boardPoint = toBoardPoint(event);

        // 지우개는 누르고 있지 않아도 위치를 보여준다
        if (drawingTool === "erase") {
            setEraserPoint(boardPoint);

            if (activePointerRef.current === event.pointerId) {
                onErase(boardPoint, eraserRadius);
            }

            return;
        }

        if (activePointerRef.current !== event.pointerId) {
            return;
        }

        setCurrentPoints((prev) => [...prev, boardPoint]);
    };

    const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
        if (activePointerRef.current !== event.pointerId) {
            return;
        }

        activePointerRef.current = null;

        if (drawingTool === "erase") {
            return;
        }

        onStrokeEnd(currentPoints);
        setCurrentPoints([]);
    };

    const handlePointerLeave = () => {
        setEraserPoint(null);
    };

    return (
        <svg
            ref={layerRef}
            // 그리기·지우기 중에는 useBoardScroll이 이 레이어에서 보드 패닝을 시작하지 않도록 표시한다
            data-drawing-capture={capturesInput ? "true" : undefined}
            className="absolute left-0 top-0 h-full w-full"
            style={{
                zIndex: ACTIVE_CARD_Z - 1,
                // 드로잉 모드가 꺼져 있으면 어떤 속성도 남기지 않는다
                pointerEvents: drawingMode ? "auto" : "none",
                touchAction: capturesInput ? "none" : undefined,
                cursor: capturesInput ? "crosshair" : undefined,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerLeave}
        >
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
                    fill="rgba(244, 114, 182, 0.15)"
                    stroke="#f472b6"
                    strokeWidth={1 / zoom}
                />
            )}
        </svg>
    );
}
