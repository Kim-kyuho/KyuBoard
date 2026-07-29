import { useRef, useState } from "react";
import {
    BoardStroke,
    StrokePoint,
    createStrokeId,
    defaultPenColor,
    defaultPenWidth,
} from "@/lib/board-stroke";

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

    const handleUndoStroke = () => {
        if (strokes.length === 0) {
            return;
        }

        unsavedRef.current = true;
        setStrokes((prev) => prev.slice(0, -1));
    };

    const handleClearStrokes = () => {
        if (strokes.length === 0) {
            return;
        }

        unsavedRef.current = true;
        setStrokes([]);
    };

    return {
        strokes,
        drawingMode,
        penColor,
        setPenColor,
        penWidth,
        setPenWidth,
        handleToggleDrawingMode,
        handleStrokeEnd,
        handleUndoStroke,
        handleClearStrokes,
    };
}
