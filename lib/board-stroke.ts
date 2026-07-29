import { z } from "zod";

// 획을 이루는 점 하나 - 보드 절대 좌표 [x, y]
const strokePointSchema = z.tuple([z.number(), z.number()]);

const boardStrokeSchema = z.object({
    id: z.string().min(1),
    color: z.string().min(1),
    width: z.number().positive(),
    points: z.array(strokePointSchema).min(2),
});

export const boardStrokesSchema = z.array(boardStrokeSchema);

export type StrokePoint = z.infer<typeof strokePointSchema>;
export type BoardStroke = z.infer<typeof boardStrokeSchema>;

// 펜 색상 프리셋 - 메모 색상과 같은 방식으로 고정 목록을 제공
export const penColors = [
    { name: "Ink", value: "#1f2937" },
    { name: "Red", value: "#e11d48" },
    { name: "Blue", value: "#2563eb" },
    { name: "Green", value: "#16a34a" },
    { name: "Amber", value: "#d97706" },
];

// 펜 굵기 프리셋
export const penWidths = [
    { name: "Thin", value: 2 },
    { name: "Medium", value: 4 },
    { name: "Bold", value: 8 },
];

export const defaultPenColor = penColors[0].value;
export const defaultPenWidth = penWidths[1].value;

// 획 ID 생성 - crypto.randomUUID는 보안 컨텍스트(HTTPS/localhost)에서만 동작해서
// LAN IP로 접속한 개발 환경에서는 쓸 수 없다. 보드 안에서만 구분되면 되므로 직접 만든다
export const createStrokeId = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// 점 배열을 SVG path 문자열로 변환
// 점을 직선으로 이으면 각져 보이므로, 각 점을 제어점으로 하고
// 다음 점과의 중점을 끝점으로 하는 2차 베지에로 부드럽게 만든다
export const strokeToPath = (points: StrokePoint[]) => {
    if (points.length === 0) {
        return "";
    }

    const [firstX, firstY] = points[0];

    if (points.length === 1) {
        return `M ${firstX} ${firstY}`;
    }

    if (points.length === 2) {
        const [lastX, lastY] = points[1];
        return `M ${firstX} ${firstY} L ${lastX} ${lastY}`;
    }

    let path = `M ${firstX} ${firstY}`;

    for (let index = 1; index < points.length - 1; index += 1) {
        const [controlX, controlY] = points[index];
        const [nextX, nextY] = points[index + 1];

        path += ` Q ${controlX} ${controlY} ${(controlX + nextX) / 2} ${(controlY + nextY) / 2}`;
    }

    const [lastX, lastY] = points[points.length - 1];
    path += ` L ${lastX} ${lastY}`;

    return path;
};
