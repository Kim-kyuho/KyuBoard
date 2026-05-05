import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { getDb } from "@/lib/db";
import { db_boards } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

// 보드 생성을 위한 API
export async function POST(request: NextRequest) {
    // 현제 Sign-in유저 정보
    const currentUser = await getCurrentUserFromRequest(request);
    // 유저 정보가 존재하지 않거나 admin권한이 없을 시 false를 리턴
    if (currentUser?.role !== "admin") {
        return NextResponse.json({
            ok: false,
            message: "Only administrators can create boards.",
        });
    }

    // body정보(title, width, height)를 request
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const width = Number(body.width);
    const height = Number(body.height);

    if (!title || !Number.isInteger(width) || !Number.isInteger(height)) {
        return NextResponse.json({
            ok: false,
            message: "Board title and size are required.",
        });
    }

    const db = getDb();
    const now = new Date();
    // 보드 생성을 위한 INSERT - board_id는 시퀀스 값이므로 입력하지 않음
    const newBoard = await db
        .insert(db_boards)
        .values({
            title,
            width,
            height,
            ownerId: 1,
            createdAt: now,
        })
        .returning();

    return NextResponse.json({ ok: true, board: newBoard[0] });
}
