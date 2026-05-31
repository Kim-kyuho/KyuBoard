import { sessionCookieName } from "@/lib/auth/session";
import { NextResponse } from "next/server";

// SignOut을 위한 API
export async function POST() {
    try {
        const response = NextResponse.json({ 
            ok: true 
        }, { status: 200 });
        // 브라우저에 저장된 sessionCookieName쿠키을 삭제
        response.cookies.delete(sessionCookieName);

        return response;
    } catch (error) {
        console.error("Error signing out:", error);
        return NextResponse.json({
            ok: false,
            message: "An error occurred while signing out.",
        },{ status: 500 });
    }
}
