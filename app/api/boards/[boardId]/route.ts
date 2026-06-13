import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { getDb } from "@/lib/db";
import { db_boards, db_memos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


// 메모 수정 API - PATCH 요청을 처리하여 특정 ID의 메모를 업데이트
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
){
    try {
        // 현재 Sign-in유저 정보
        const currentUser = await getCurrentUserFromRequest(request);

        // 유저 정보가 존재하지 않거나 admin권한이 없을 시 false를 리턴
        if (currentUser?.role !== "admin") {
            return NextResponse.json({
                ok: false,
                message: "Only administrators can rename boards.",
            },{ status: 403 });
        }

        // route params로부터 boardId를 GET
        const db = getDb();
        const { boardId } = await params;
        const boardIdNumber = Number(boardId);
        const body = await request.json();
        const updates: Partial<typeof db_boards.$inferInsert> = {};
    
        // boardId가 숫자가 아닐 경우 false를 리턴
        if (!Number.isInteger(boardIdNumber)) {
            return NextResponse.json({
                ok: false,
                message: "Invalid board id.",
            },{ status: 400 });
        }
        if(body.boardId !== undefined) {updates.boardId = body.boardId};
        if(body.title !== undefined) {updates.title = body.title};
 
        if (Object.keys(updates).length === 0) {
            return NextResponse.json({
                ok: false,
                message: "No update fields were provided.",
            }, { status: 400 });
        }

        const updatedBoard = await db
            .update(db_boards)
            .set(updates)
            .where(eq(db_boards.boardId, boardIdNumber)).returning();

        return NextResponse.json({
            ok:true,
            board: updatedBoard[0],
        },{ status:200 });
  
    } catch (error) {
        console.error("Error updating memo:", error);
        return NextResponse.json({
            ok: false,
            message: "An error occurred while updating the memo.",
        },{ status: 500 });
    }
}
// 보드 삭제를 위한 API
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
) {
    try {
        // 현재 Sign-in유저 정보
        const currentUser = await getCurrentUserFromRequest(request);

        // 유저 정보가 존재하지 않거나 admin권한이 없을 시 false를 리턴
        if (currentUser?.role !== "admin") {
            return NextResponse.json({
                ok: false,
                message: "Only administrators can delete boards.",
            },{ status: 403 });
        }

        // route params로부터 boardId를 GET
        const { boardId } = await params;
        const boardIdNumber = Number(boardId);

        // boardId가 숫자가 아닐 경우 false를 리턴
        if (!Number.isInteger(boardIdNumber)) {
            return NextResponse.json({
                ok: false,
                message: "Invalid board id.",
            },{ status: 400 });
        }

        const db = getDb();
        // 삭제 대상 보드가 존재하는지 체크
        const targetBoard = await db
            .select()
            .from(db_boards)
            .where(eq(db_boards.boardId, boardIdNumber))
            .limit(1);

        if (!targetBoard[0]) {
            return NextResponse.json({
                ok: false,
                message: "This board does not exist.",
            },{ status: 404 });
        }

        // 삭제 대상 보드와 연결된 메모를 먼저 삭제
        await db
            .delete(db_memos)
            .where(eq(db_memos.boardId, boardIdNumber));

        // 연결된 메모 삭제 후 보드 삭제
        const deletedBoard = await db
            .delete(db_boards)
            .where(eq(db_boards.boardId, boardIdNumber))
            .returning();

        return NextResponse.json({ 
            ok: true, 
            board: deletedBoard[0] });
    } catch (error) {
        console.error("Error deleting board:", error);
        return NextResponse.json({
            ok: false,
            message: "An error occurred while deleting the board.",
        },{ status: 500 });
    }
}
