import { db } from "@/lib/db";
import { db_memos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await request.json();

    await db
    .update(db_memos)
    .set({ content: body.content })
    .where(eq(db_memos.id, parseInt(id)));

    return NextResponse.json({ ok: true});
}

export async function DELETE(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    await db
    .delete(db_memos)
    .where(eq(db_memos.id, parseInt(id)));
    
    return NextResponse.json({ ok: true});
}   