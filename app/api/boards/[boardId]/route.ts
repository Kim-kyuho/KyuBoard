import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { getDb } from "@/lib/db";
import { db_boards, db_memos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
){
    try {
        const currentUser = await getCurrentUserFromRequest(request);

        if (currentUser?.role !== "admin") {
            return NextResponse.json({
                ok: false,
                message: "Only administrators can rename boards.",
            },{ status: 403 });
        }

        const db = getDb();
        const { boardId } = await params;
        const boardIdNumber = Number(boardId);
        const body = await request.json();
        const updates: Partial<typeof db_boards.$inferInsert> = {};
    
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
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);

        if (currentUser?.role !== "admin") {
            return NextResponse.json({
                ok: false,
                message: "Only administrators can delete boards.",
            },{ status: 403 });
        }

        const { boardId } = await params;
        const boardIdNumber = Number(boardId);

        if (!Number.isInteger(boardIdNumber)) {
            return NextResponse.json({
                ok: false,
                message: "Invalid board id.",
            },{ status: 400 });
        }

        const db = getDb();
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

        await db
            .delete(db_memos)
            .where(eq(db_memos.boardId, boardIdNumber));

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
