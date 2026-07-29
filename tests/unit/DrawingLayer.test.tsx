import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DrawingLayer from "@/components/DrawingLayer";
import type { DrawingTool } from "@/hooks/useBoardDrawing";
import { defaultPenColor, defaultPenWidth, type BoardStroke } from "@/lib/board-stroke";

// useBoardScroll이 보드 패닝을 시작해도 되는지 판단할 때 쓰는 선택자
const canStartBoardPanSelector =
    "[data-editing='true'], [data-drawing-capture='true'], .board-toolbar, .confirm-dialog, button, input, textarea, a, [contenteditable='true']";

const stroke: BoardStroke = {
    id: "s1",
    color: defaultPenColor,
    width: defaultPenWidth,
    points: [[0, 0], [10, 10], [20, 0]],
};

function renderLayer(drawingMode: boolean, drawingTool: DrawingTool) {
    const { container } = render(
        <DrawingLayer
            strokes={[stroke]}
            drawingMode={drawingMode}
            drawingTool={drawingTool}
            penColor={defaultPenColor}
            penWidth={defaultPenWidth}
            zoom={0.75}
            onStrokeEnd={vi.fn()}
            onErase={vi.fn()}
        />
    );

    return container.querySelector("svg")!;
}

describe("DrawingLayer pointer routing", () => {
    it("stays transparent to input while drawing mode is off", () => {
        const layer = renderLayer(false, "draw");

        expect(layer.style.pointerEvents).toBe("none");
        // touch-action을 남겨두면 아이패드에서 아래쪽 터치가 막힐 수 있다
        expect(layer.style.touchAction).toBe("");
        expect(layer.getAttribute("data-drawing-capture")).toBeNull();
    });

    it("captures input and blocks board panning while drawing", () => {
        const layer = renderLayer(true, "draw");

        expect(layer.style.pointerEvents).toBe("auto");
        expect(layer.style.touchAction).toBe("none");
        expect(layer.closest(canStartBoardPanSelector)).not.toBeNull();
    });

    it("captures input and blocks board panning while erasing", () => {
        const layer = renderLayer(true, "erase");

        expect(layer.style.pointerEvents).toBe("auto");
        expect(layer.style.touchAction).toBe("none");
        expect(layer.closest(canStartBoardPanSelector)).not.toBeNull();
    });

    it("keeps cards blocked but lets the board pan while the hand tool is on", () => {
        const layer = renderLayer(true, "pan");

        // 카드가 눌리면 안 되므로 입력은 계속 레이어가 받는다
        expect(layer.style.pointerEvents).toBe("auto");
        // 스크롤과 패닝은 살아 있어야 한다
        expect(layer.style.touchAction).toBe("");
        expect(layer.closest(canStartBoardPanSelector)).toBeNull();
    });

    it("renders saved strokes and shows the eraser circle only in erase mode", () => {
        expect(renderLayer(true, "draw").querySelectorAll("path")).toHaveLength(1);
        expect(renderLayer(true, "draw").querySelector("circle")).toBeNull();
        expect(renderLayer(true, "erase").querySelector("circle")).toBeNull();
    });
});
