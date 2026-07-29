import { describe, expect, it } from "vitest";
import {
    boardStrokesSchema,
    createStrokeId,
    defaultPenColor,
    defaultPenWidth,
    strokeToPath,
} from "@/lib/board-stroke";

const stroke = {
    id: "s1",
    color: defaultPenColor,
    width: defaultPenWidth,
    points: [[10, 20], [30, 40]],
};

describe("boardStrokesSchema", () => {
    it("accepts a valid stroke list", () => {
        expect(boardStrokesSchema.safeParse([stroke]).success).toBe(true);
        expect(boardStrokesSchema.safeParse([]).success).toBe(true);
    });

    it("rejects a stroke with fewer than two points", () => {
        expect(boardStrokesSchema.safeParse([{ ...stroke, points: [[10, 20]] }]).success).toBe(false);
    });

    it("rejects malformed points, empty ids, and non-positive widths", () => {
        expect(boardStrokesSchema.safeParse([{ ...stroke, points: [[10], [30, 40]] }]).success).toBe(false);
        expect(boardStrokesSchema.safeParse([{ ...stroke, id: "" }]).success).toBe(false);
        expect(boardStrokesSchema.safeParse([{ ...stroke, width: 0 }]).success).toBe(false);
    });
});

describe("strokeToPath", () => {
    it("returns an empty string when there are no points", () => {
        expect(strokeToPath([])).toBe("");
    });

    it("draws a straight line for two points", () => {
        expect(strokeToPath([[10, 20], [30, 40]])).toBe("M 10 20 L 30 40");
    });

    it("smooths three or more points with quadratic curves through midpoints", () => {
        expect(strokeToPath([[0, 0], [10, 10], [20, 0]])).toBe("M 0 0 Q 10 10 15 5 L 20 0");
    });

    it("keeps every point of a long stroke in the path", () => {
        const points: [number, number][] = Array.from({ length: 20 }, (_, index) => [index, index * 2]);

        expect(strokeToPath(points).match(/Q/g)).toHaveLength(18);
    });
});

describe("createStrokeId", () => {
    it("does not depend on crypto.randomUUID", () => {
        expect(typeof createStrokeId()).toBe("string");
        expect(createStrokeId().length).toBeGreaterThan(0);
    });

    it("produces different ids on repeated calls", () => {
        const ids = new Set(Array.from({ length: 50 }, () => createStrokeId()));

        expect(ids.size).toBe(50);
    });
});
