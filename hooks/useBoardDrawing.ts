import { useRef, useState } from "react";
import {
    BoardStroke,
    StrokePoint,
    createStrokeId,
    defaultPenColor,
    defaultPenWidth,
    eraseStrokesInCircle,
} from "@/lib/board-stroke";

// 드로잉 모드 안의 하위 모드
// draw  - 선을 긋는다 (기본)
// pan   - 선을 긋지 않고 보드만 움직인다
// erase - 원형 영역에 닿은 부분을 지운다
export type DrawingTool = "draw" | "pan" | "erase";

type UseBoardDrawingOptions = {
    initialStrokes: BoardStroke[];
    boardId: number;
    canEditCard: boolean;
    showPermissionMessage: () => void;
    setPermissionMessage: (message: string) => void;
};

export function useBoardDrawing({
    initialStrokes,
    boardId,
    canEditCard,
    showPermissionMessage,
    setPermissionMessage,
}: UseBoardDrawingOptions) {
    const [strokes, setStrokes] = useState(initialStrokes);
    const [drawingMode, setDrawingMode] = useState(false);
    const [drawingTool, setDrawingTool] = useState<DrawingTool>("draw");
    const [penColor, setPenColor] = useState(defaultPenColor);
    const [penWidth, setPenWidth] = useState(defaultPenWidth);
    // 그리기 모드를 끌 때 변경이 있었을 경우에만 저장하기 위한 Ref
    const unsavedRef = useRef(false);

    const saveStrokes = async (nextStrokes: BoardStroke[]) => {
        const response = await fetch(`/api/drawings/${boardId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ strokes: nextStrokes }),
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
            setPermissionMessage(data.message ?? "Drawing could not be saved.");
        }
    };

    // 그리기 모드 토글 - 끄는 시점이 곧 저장 시점이다
    const handleToggleDrawingMode = () => {
        if (drawingMode) {
            setDrawingMode(false);
            setDrawingTool("draw");

            if (unsavedRef.current) {
                unsavedRef.current = false;
                void saveStrokes(strokes);
            }

            return;
        }

        if (!canEditCard) {
            showPermissionMessage();
            return;
        }

        setDrawingMode(true);
        setDrawingTool("draw");
    };

    // 손바닥·지우개 버튼은 누를 때마다 켜지고 꺼진다. 꺼지면 기본인 그리기로 돌아간다
    const toggleDrawingTool = (tool: Exclude<DrawingTool, "draw">) => {
        setDrawingTool((prev) => (prev === tool ? "draw" : tool));
    };

    const handleStrokeEnd = (points: StrokePoint[]) => {
        if (points.length < 2) {
            return;
        }

        unsavedRef.current = true;
        setStrokes((prev) => [
            ...prev,
            {
                id: createStrokeId(),
                color: penColor,
                width: penWidth,
                points,
            },
        ]);
    };

    const handleErase = (center: StrokePoint, radius: number) => {
        setStrokes((prev) => {
            const nextStrokes = eraseStrokesInCircle(prev, center, radius);

            if (nextStrokes !== prev) {
                unsavedRef.current = true;
            }

            return nextStrokes;
        });
    };

    const handleUndoStroke = () => {
        if (strokes.length === 0) {
            return;
        }

        unsavedRef.current = true;
        setStrokes((prev) => prev.slice(0, -1));
    };

    return {
        strokes,
        drawingMode,
        drawingTool,
        penColor,
        setPenColor,
        penWidth,
        setPenWidth,
        handleToggleDrawingMode,
        handleTogglePanTool: () => toggleDrawingTool("pan"),
        handleToggleEraseTool: () => toggleDrawingTool("erase"),
        handleStrokeEnd,
        handleErase,
        handleUndoStroke,
    };
}
