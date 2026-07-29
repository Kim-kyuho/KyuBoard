import { getCardPermissionMessage, getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { getDb } from "@/lib/db";
import { db_drawings } from "@/lib/db/schema";
import { boardStrokesSchema } from "@/lib/board-stroke";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// 보드의 획 GET - 아직 그린 적이 없으면 빈 배열을 리턴
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
) {
    try {
        const { boardId } = await params;
        const boardIdNumber = Number(boardId);

        if (!Number.isInteger(boardIdNumber) || boardIdNumber <= 0) {
            return NextResponse.json({
                ok: false,
                message: "Invalid board id.",
            }, { status: 400 });
        }

        const db = getDb();
        const drawings = await db
            .select({ source: db_drawings.source })
            .from(db_drawings)
            .where(eq(db_drawings.boardId, boardIdNumber))
            .limit(1);

        return NextResponse.json({
            ok: true,
            strokes: drawings[0]?.source ?? [],
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching board strokes:", error);
        return NextResponse.json({
            ok: false,
            message: "An error occurred while fetching the board strokes.",
        }, { status: 500 });
    }
}

// 보드의 획 저장 - 그리기 모드를 끄는 시점에 전체를 한 번에 덮어쓴다
// board_id가 unique라 onConflictDoUpdate로 최초 생성과 갱신을 한 문으로 처리한다
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);
        const permissionMessage = getCardPermissionMessage(currentUser);

        if (permissionMessage) {
            return NextResponse.json({
                ok: false,
                message: permissionMessage,
            }, { status: 403 });
        }

        const { boardId } = await params;
        const boardIdNumber = Number(boardId);

        if (!Number.isInteger(boardIdNumber) || boardIdNumber <= 0) {
            return NextResponse.json({
                ok: false,
                message: "Invalid board id.",
            }, { status: 400 });
        }

        const body = await request.json();
        const strokes = boardStrokesSchema.safeParse(body.strokes);

        if (!strokes.success) {
            return NextResponse.json({
                ok: false,
                message: "Invalid stroke data.",
            }, { status: 400 });
        }

        const db = getDb();
        await db
            .insert(db_drawings)
            .values({
                boardId: boardIdNumber,
                source: strokes.data,
            })
            .onConflictDoUpdate({
                target: db_drawings.boardId,
                set: {
                    source: strokes.data,
                    updatedAt: new Date(),
                },
            });

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        console.error("Error saving board strokes:", error);
        return NextResponse.json({
            ok: false,
            message: "An error occurred while saving the board strokes.",
        }, { status: 500 });
    }
}
