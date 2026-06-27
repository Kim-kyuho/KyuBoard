import { getUserIdFromSessionToken, sessionCookieName } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { db_users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export { getMemoPermissionMessage } from "@/lib/auth/permissions";

// 현재 유저정보 GET 위한 라이브러리
export async function getCurrentUserFromRequest(request: NextRequest) {
    try {
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
    } catch (error) {
        console.error("Error fetching current user:", error);
        throw error;
    }
}
