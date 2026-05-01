import { getDb } from "@/lib/db";
import { getCurrentUserFromRequest, getMemoPermissionMessage } from "@/lib/auth/current-user";
import { db_memos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// 메모 수정 API - PATCH 요청을 처리하여 특정 ID의 메모를 업데이트
export async function PATCH(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    const currentUser = await getCurrentUserFromRequest(request);
    const permissionMessage = getMemoPermissionMessage(currentUser);

    if (permissionMessage) {
        return NextResponse.json({
            ok: false,
            message: permissionMessage,
        });
    }

    const db = getDb();
    const { id } = await params;
    const body = await request.json();
    const updates: Partial<typeof db_memos.$inferInsert> = {};
    // 업데이트할 필드가 요청 본문에 존재하는 경우에만 업데이트 객체에 추가 - undefined 체크를 통해 필요한 필드만 업데이트
    if (body.content !== undefined) updates.content = body.content;
    if (body.x !== undefined) updates.x = body.x;
    if (body.y !== undefined) updates.y = body.y;
    if (body.width !== undefined) updates.width = body.width;
    if (body.height !== undefined) updates.height = body.height;
    if (body.color !== undefined) updates.color = body.color;
    if (body.isPublic !== undefined) updates.isPublic = body.isPublic;

    await db
    .update(db_memos)
    .set(updates)
    .where(eq(db_memos.id, parseInt(id)));

    return NextResponse.json({ ok: true});
}
// 메모 삭제 API - DELETE 요청을 처리하여 특정 ID의 메모를 데이터베이스에서 삭제
export async function DELETE(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    const currentUser = await getCurrentUserFromRequest(request);
    const permissionMessage = getMemoPermissionMessage(currentUser);

    if (permissionMessage) {
        return NextResponse.json({
            ok: false,
            message: permissionMessage,
        });
    }

    const db = getDb();
    const { id } = await params;
    
    await db
    .delete(db_memos)
    .where(eq(db_memos.id, parseInt(id)));
    
    return NextResponse.json({ ok: true});
}   
