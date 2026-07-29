import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DrawingLayer from "@/components/DrawingLayer";
import { defaultPenColor, defaultPenWidth } from "@/lib/board-stroke";

function setup() {
    const onStrokeEnd = vi.fn();
    const { container } = render(
        <DrawingLayer
            strokes={[]}
            drawingMode
            drawingTool="draw"
            penColor={defaultPenColor}
            penWidth={defaultPenWidth}
            zoom={1}
            onStrokeEnd={onStrokeEnd}
            onErase={vi.fn()}
        />
    );

    return { layer: container.querySelector("svg")!, onStrokeEnd };
}

// 애플펜슬은 화면에서 살짝 떨어져도 같은 포인터가 호버로 살아 있다
const pen = (extra: Record<string, unknown>) => ({ pointerId: 1, pointerType: "pen", isPrimary: true, ...extra });

describe("Apple Pencil stroke handling", () => {
    it("starts a new stroke even when the previous pointerup was missed", () => {
        const { layer, onStrokeEnd } = setup();

        // 첫 획
        fireEvent.pointerDown(layer, pen({ buttons: 1, clientX: 0, clientY: 0 }));
        fireEvent.pointerMove(layer, pen({ buttons: 1, clientX: 10, clientY: 10 }));
        // pointerup 이 오지 않은 채로 다시 눌린다
        fireEvent.pointerDown(layer, pen({ buttons: 1, clientX: 40, clientY: 40 }));
        fireEvent.pointerMove(layer, pen({ buttons: 1, clientX: 50, clientY: 50 }));
        fireEvent.pointerUp(layer, pen({ buttons: 0 }));

        // 첫 획과 두 번째 획이 모두 남아야 한다
        expect(onStrokeEnd).toHaveBeenCalledTimes(2);
    });

    it("ends the stroke when the pen lifts into hover instead of drawing on", () => {
        const { layer, onStrokeEnd } = setup();

        fireEvent.pointerDown(layer, pen({ buttons: 1, clientX: 0, clientY: 0 }));
        fireEvent.pointerMove(layer, pen({ buttons: 1, clientX: 10, clientY: 10 }));
        // 펜을 뗀 채 호버로 이동
        fireEvent.pointerMove(layer, pen({ buttons: 0, clientX: 200, clientY: 200 }));

        expect(onStrokeEnd).toHaveBeenCalledTimes(1);
        // 호버 지점이 획에 섞이면 안 된다
        expect(onStrokeEnd.mock.calls[0][0]).toEqual([[0, 0], [10, 10]]);
    });

    it("ignores a second finger while a stroke is in progress", () => {
        const { layer, onStrokeEnd } = setup();

        fireEvent.pointerDown(layer, pen({ buttons: 1, clientX: 0, clientY: 0 }));
        fireEvent.pointerDown(layer, { pointerId: 2, pointerType: "touch", isPrimary: false, buttons: 1, clientX: 90, clientY: 90 });
        fireEvent.pointerMove(layer, pen({ buttons: 1, clientX: 10, clientY: 10 }));
        fireEvent.pointerUp(layer, pen({ buttons: 0 }));

        expect(onStrokeEnd).toHaveBeenCalledTimes(1);
        expect(onStrokeEnd.mock.calls[0][0]).toEqual([[0, 0], [10, 10]]);
    });
});
