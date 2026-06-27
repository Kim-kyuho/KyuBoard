import { z } from "zod";

const finiteNumber = z.number().finite();
const positiveFiniteNumber = finiteNumber.positive();

export const createMemoSchema = z.object({
    boardId: z.number().int().positive(),
    content: z.string(),
    x: finiteNumber,
    y: finiteNumber,
    z: finiteNumber,
    width: positiveFiniteNumber,
    height: positiveFiniteNumber,
    color: z.string().trim().min(1),
    isPublic: z.boolean(),
}).strict();

export const updateMemoSchema = createMemoSchema.partial();

export type CreateMemoInput = z.infer<typeof createMemoSchema>;
export type UpdateMemoInput = z.infer<typeof updateMemoSchema>;
