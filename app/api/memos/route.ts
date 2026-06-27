import { getDb } from "@/lib/db";
import { getCurrentUserFromRequest, getMemoPermissionMessage } from "@/lib/auth/current-user";
import { db_memos } from "@/lib/db/schema";
import { createMemoSchema } from "@/lib/validation/memos";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);
        const permissionMessage = getMemoPermissionMessage(currentUser);
        if (permissionMessage) {
            return NextResponse.json({
                ok: false,
                message: permissionMessage,
            },{ status: 403 });
        }

        const db = getDb();
        const parsedBody = createMemoSchema.safeParse(await request.json());

        if (!parsedBody.success) {
            return NextResponse.json({
                ok: false,
                message: "Invalid request body.",
            }, { status: 400 });
        }

        const newMemo = await db
        .insert(db_memos)
        .values(parsedBody.data)
        .returning();
        
        return NextResponse.json({ 
            ok: true, 
            memo: newMemo[0] 
        }, { status: 200 });
    } catch (error) {
        console.error("Error creating memo:", error);
        return NextResponse.json({
            ok: false,
            message: "An error occurred while creating the memo.",
        },{ status: 500 });
    }
}
