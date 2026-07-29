"use client";

import { PointerEvent as ReactPointerEvent, useRef, useState } from "react";
import { BoardStroke, StrokePoint, strokeToPath } from "@/lib/board-stroke";
import { ACTIVE_CARD_Z } from "@/lib/zIndex";

type DrawingLayerProps = {
    strokes: BoardStroke[];
    drawingMode: boolean;
    penColor: string;
    penWidth: number;
    zoom: number;
    onStrokeEnd: (points: StrokePoint[]) => void;
};

// 보드 위에 덮이는 획 레이어
// 카드들의 z 통합 정렬에 참여하지 않고 항상 최상단에 그려진다
export default function DrawingLayer({
    strokes,
    drawingMode,
    penColor,
    penWidth,
    zoom,
    onStrokeEnd,
}: DrawingLayerProps) {
    const layerRef = useRef<SVGSVGElement | null>(null);
    const drawingPointerRef = useRef<number | null>(null);
    const [currentPoints, setCurrentPoints] = useState<StrokePoint[]>([]);

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
        if (!drawingMode || drawingPointerRef.current !== null) {
            return;
        }

        drawingPointerRef.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        setCurrentPoints([toBoardPoint(event)]);
    };

    const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
        if (drawingPointerRef.current !== event.pointerId) {
            return;
        }

        const nextPoint = toBoardPoint(event);
        setCurrentPoints((prev) => [...prev, nextPoint]);
    };

    const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
        if (drawingPointerRef.current !== event.pointerId) {
            return;
        }

        drawingPointerRef.current = null;
        onStrokeEnd(currentPoints);
        setCurrentPoints([]);
    };

    return (
        <svg
            ref={layerRef}
            className="absolute left-0 top-0 h-full w-full"
            style={{
                zIndex: ACTIVE_CARD_Z - 1,
                pointerEvents: drawingMode ? "auto" : "none",
                touchAction: "none",
                cursor: drawingMode ? "crosshair" : "default",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
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
        </svg>
    );
}
