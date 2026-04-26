import { getDb } from "@/lib/db";
import { db_memos } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

// 메모 생성 API - POST 요청을 처리하여 새로운 메모를 데이터베이스에 추가
export async function POST(request: NextRequest) {
    const db = getDb();
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
