import { db } from "@/lib/db";
import { db_memos } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const body = await request.json();

    const newMemo = await db
    .insert(db_memos)
    .values({
        boardId: body.boardId,
        content: body.content,
        x: body.x,
        y: body.y,
        width: body.width,
        height: body.height,
        color: body.color,
        isPublic: body.isPublic,
    }).returning();
    
    return NextResponse.json({ memo: newMemo[0] });
}