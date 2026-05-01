import { sessionCookieName } from "@/lib/auth/session";
import { NextResponse } from "next/server";

// SignOut을 위한 API
export async function POST() {
    const response = NextResponse.json({ ok: true });

    response.cookies.delete(sessionCookieName);

    return response;
}
