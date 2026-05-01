import { getUserIdFromSessionToken, sessionCookieName } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { db_users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

// 현재 유저정보 GET 위한 라이브러리
export async function getCurrentUserFromRequest(request: NextRequest) {
    // 세션 토큰으로 부터 Id를 GET
    const userId = getUserIdFromSessionToken(
        request.cookies.get(sessionCookieName)?.value
    );

    //유저 정보가 없을 경우 null를 리턴
    if (!userId) {
        return null;
    }

    //유저 아이디를 검색 - 존재하지 않는 id일 경우 null를 리턴
    const db = getDb();
    const users = await db
        .select({
            id: db_users.id,
            email: db_users.email,
            permissionFlg: db_users.permissionFlg,
            role: db_users.role,
        })
        .from(db_users)
        .where(eq(db_users.id, userId))
        .limit(1);

    return users[0] ?? null;
}

// 메시지 출력을 위한 기능 - ** 수정시 BoardClient의 showPermissionMessage도 함꼐 수정할 필요가 있음.
export function getMemoPermissionMessage(
    user: Awaited<ReturnType<typeof getCurrentUserFromRequest>>
) {
    // Sign in을 하지 않았을 경우 출력 메시지
    if (!user) {
        return "Please sign in before editing memos.";
    }
    // Sign up 후 허가되지 않은 유저의 경우 출력 메시지
    if (!user.permissionFlg) {
        return "Your account is waiting for administrator approval.";
    }

    return null;
}
