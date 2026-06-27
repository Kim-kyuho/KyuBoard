import { getDb } from "@/lib/db";
import { getCurrentUserFromRequest, getMemoPermissionMessage } from "@/lib/auth/current-user";
import { db_memos } from "@/lib/db/schema";
import { updateMemoSchema } from "@/lib/validation/memos";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function isJsonObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function PATCH(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);
        const permissionMessage = getMemoPermissionMessage(currentUser);

        if (permissionMessage) {
            return NextResponse.json({
                ok: false,
                message: permissionMessage,
            }, { status: 403 });
        }

        const db = getDb();
        const { id } = await params;
        const body = await request.json();
        const memoId = Number(id);

        if (!Number.isInteger(memoId)) {
            return NextResponse.json({
                ok: false,
                message: "Invalid memo id.",
            }, { status: 400 });
        }

        if (!isJsonObject(body)) {
            return NextResponse.json({
                ok: false,
                message: "Invalid request body.",
            }, { status: 400 });
        }

        if (Object.keys(body).length === 0) {
            return NextResponse.json({
                ok: false,
                message: "No update fields were provided.",
            }, { status: 400 });
        }

        const parsedBody = updateMemoSchema.safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({
                ok: false,
                message: "Invalid request body.",
            }, { status: 400 });
        }

        const updatedMemo = await db
        .update(db_memos)
        .set(parsedBody.data)
        .where(eq(db_memos.id, memoId)).returning();
        
        if (!updatedMemo[0]) {
            return NextResponse.json({
                ok: false,
                message: "Memo does not exist.",
            }, { status: 404 });
        }

        return NextResponse.json({ ok: true}, { status: 200 });
    } catch (error) {
        console.error("Error updating memo:", error);
        return NextResponse.json({
            ok: false,
            message: "An error occurred while updating the memo.",
        },{ status: 500 });
    }
}
export async function DELETE(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);
        const permissionMessage = getMemoPermissionMessage(currentUser);

        if (permissionMessage) {
            return NextResponse.json({
                ok: false,
                message: permissionMessage,
            }, { status: 403 });
        }

        const db = getDb();
        const { id } = await params;
        const memoId = Number(id);
        if (!Number.isInteger(memoId)) {
            return NextResponse.json({
                ok: false,
                message: "Invalid memo id.",
            }, { status: 400 });
        }
        const deletedMemo = await db
        .delete(db_memos)
        .where(eq(db_memos.id, memoId))
        .returning();
        
        if (!deletedMemo[0]) {
            return NextResponse.json({
                ok: false,
                message: "Memo does not exist.",
            }, { status: 404 });
        }

        return NextResponse.json({ 
            ok: true
        }, { status: 200 });
    } catch (error) {
        console.error("Error deleting memo:", error);
        return NextResponse.json({
            ok: false,
            message: "An error occurred while deleting the memo.",
        },{ status: 500 });
    }
}
