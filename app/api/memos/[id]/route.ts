import { getDb } from "@/lib/db";
import { db_memos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    await db
    .update(db_memos)
    .set({ content: body.content, x: body.x, y: body.y, width: body.width, height: body.height, color: body.color, isPublic: body.isPublic })
    .where(eq(db_memos.id, parseInt(id)));

    return NextResponse.json({ ok: true});
}

export async function DELETE(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    const db = getDb();
    const { id } = await params;
    
    await db
    .delete(db_memos)
    .where(eq(db_memos.id, parseInt(id)));
    
    return NextResponse.json({ ok: true});
}   
