import { getDb } from "@/lib/db";
import { db_users } from "@/lib/db/schema";
import { createSessionToken, sessionCookieName } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// SignIn을 위한 API
export async function POST(request: NextRequest) {
    const db = getDb();
    const body = await request.json();
    const email = String(body.email ?? "");
    const password = String(body.password ?? "");
    
    // 이메일 또는 패스워드 정보가 기재되어있지 않을 경우, 이하의 false와 메시지를 Response
    if (!email || !password) {
        return NextResponse.json({
            ok: false,
            message: "Please enter your email and password.",
        });
    }

    // DB로부터 입력한 이메일을 Select
    const users = await db
        .select({
            id: db_users.id,
            email: db_users.email,
            passwordHash: db_users.passwordHash,
            permissionFlg: db_users.permissionFlg,
            role: db_users.role,
        })
        .from(db_users)
        .where(eq(db_users.email, email))
        .limit(1);
    const user = users[0];
    
    // 이메일이 존재하지 않거나 패스워드 입력이 틀렸을 경우, 이하의 false와 메시지를 Response
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return NextResponse.json({
            ok: false,
            message: "Email or password is incorrect.",
        });
    }

    // 입력값에 문제가 없을 경우, email, permissionFlg, role값을 Response
    const response = NextResponse.json({
        ok: true,
        user: {
            email: user.email,
            permissionFlg: user.permissionFlg,
            role: user.role,
        },
    });

    // 로그인 후 브라우저에 세션 쿠키를 설정
    response.cookies.set(sessionCookieName, createSessionToken(user.id), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    return response;
}
