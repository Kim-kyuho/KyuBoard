import { sessionCookieName } from "@/lib/auth/session";
import { NextResponse } from "next/server";

// SignOut을 위한 API
export async function POST() {
    const response = NextResponse.json({ ok: true });
    // 브라우저에 저장된 sessionCookieName쿠키을 삭제
    response.cookies.delete(sessionCookieName);

    return response;
}
