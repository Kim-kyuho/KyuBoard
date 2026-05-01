import { getDb } from "@/lib/db";
import { getCurrentUserFromRequest, getMemoPermissionMessage } from "@/lib/auth/current-user";
import { db_memos } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

// 메모 생성 API - POST 요청을 처리하여 새로운 메모를 데이터베이스에 추가
export async function POST(request: NextRequest) {
    // 현재 접속한 유저 정보
    const currentUser = await getCurrentUserFromRequest(request);
    // 유저 상태에 따른 메시지(미접속, 미허가)
    const permissionMessage = getMemoPermissionMessage(currentUser);

    // 유저 상태에 따른 메시지가 존재할 경우(유저 상태가 미접속 혹은 미허가의 경우), false와 메시지를 출력
    if (permissionMessage) {
        return NextResponse.json({
            ok: false,
            message: permissionMessage,
        });
    }

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
    
    return NextResponse.json({ ok: true, memo: newMemo[0] });
}
