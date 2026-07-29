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
    // 패닝 도구일 때는 레이어가 입력을 잡지 않아야 보드가 움직인다
    const capturesInput = drawingTool !== "pan";

    // 드로잉 모드가 꺼져 있으면 이벤트 핸들러가 하나도 없는 표시 전용 레이어만 남긴다
    // 터치 기기에서 이 레이어가 입력을 가로챌 여지를 없애기 위한 구성이다
    if (!drawingMode) {
        return (
            <svg
                pointerEvents="none"
                aria-hidden="true"
                className="absolute left-0 top-0 h-full w-full"
                style={{
                    zIndex: ACTIVE_CARD_Z - 1,
                    pointerEvents: "none",
                    // iPad에서 원치않는 텍스트 선택·드래그 방지
                    WebkitTouchCallout: "none",
                    WebkitUserSelect: "none",
                    userSelect: "none",
                }}
            >
                <StrokePaths strokes={strokes} />
            </svg>
        );
    }

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

    // 캡처가 남으면 이후 모든 포인터 이벤트가 이 레이어로 끌려간다. 반드시 풀어준다
    // 여기서 예외가 나면 획 마무리까지 함께 죽으므로 실패해도 진행한다
    const releasePointer = (event: ReactPointerEvent<SVGSVGElement>) => {
        const layer = event.currentTarget;

        try {
            if (layer.hasPointerCapture?.(event.pointerId)) {
                layer.releasePointerCapture(event.pointerId);
            }
        } catch {
            // 캡처 해제에 실패해도 무시한다
        }
    };

    // 진행 중이던 획을 마무리한다. pointerup을 놓친 상황에서도 획을 잃지 않기 위한 것
    const finishCurrentStroke = (points: StrokePoint[]) => {
        activePointerRef.current = null;

        if (points.length > 1) {
            onStrokeEnd(points);
        }

        setCurrentPoints([]);
    };

    const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
        // 두 번째 손가락은 무시한다
        if (!capturesInput || !event.isPrimary) {
            return;
        }

        // 애플펜슬은 살짝 떼어도 호버로 같은 포인터가 살아 있어 pointerup을 놓칠 수 있다
        // 새로 눌렀다는 것은 확실한 사실이므로 남아 있던 상태보다 우선한다
        if (activePointerRef.current !== null) {
            finishCurrentStroke(currentPoints);
        }

        const boardPoint = toBoardPoint(event);
        activePointerRef.current = event.pointerId;

        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            // 캡처에 실패해도 그리기 자체는 계속한다
        }

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
        // 펜이 화면에서 떨어진 상태(호버)에서도 pointermove는 계속 들어온다
        const pressed = event.buttons !== 0;

        // 지우개는 누르고 있지 않아도 위치를 보여준다
        if (drawingTool === "erase") {
            setEraserPoint(boardPoint);

            if (activePointerRef.current === event.pointerId && pressed) {
                onErase(boardPoint, eraserRadius);
            }

            return;
        }

        if (activePointerRef.current !== event.pointerId) {
            return;
        }

        // 떼어진 채로 움직이고 있다면 pointerup을 놓친 것이다. 여기서 획을 끝낸다
        if (!pressed) {
            finishCurrentStroke(currentPoints);
            return;
        }

        setCurrentPoints((prev) => [...prev, boardPoint]);
    };

    const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
        const wasDrawing = activePointerRef.current === event.pointerId;

        // 다른 포인터라도 캡처가 남아 있으면 풀어준다
        releasePointer(event);

        if (!wasDrawing) {
            return;
        }

        if (drawingTool === "erase") {
            activePointerRef.current = null;
            return;
        }

        finishCurrentStroke(currentPoints);
    };

    return (
        <svg
            ref={layerRef}
            // 그리기·지우기 중에는 useBoardScroll이 이 레이어에서 보드 패닝을 시작하지 않도록 표시한다
            data-drawing-capture={capturesInput ? "true" : undefined}
            className="absolute left-0 top-0 h-full w-full"
            style={{
                zIndex: ACTIVE_CARD_Z - 1,
                pointerEvents: "auto",
                touchAction: capturesInput ? "none" : undefined,
                cursor: capturesInput ? "crosshair" : undefined,
                // 펜으로 그을 때 아래 글씨가 선택되거나 iOS 드래그가 시작되는 것을 막는다
                WebkitTouchCallout: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onLostPointerCapture={() => { activePointerRef.current = null; }}
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
                    fill="rgba(244, 114, 182, 0.15)"
                    stroke="#f472b6"
                    strokeWidth={1 / zoom}
                />
            )}
        </svg>
    );
}
