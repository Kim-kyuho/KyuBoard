import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    // Request로부터 유저 정보를 GET
    const currentUser = await getCurrentUserFromRequest(request);

    // 유저 정보가 존재하지 않을 경우 null를 Response
    if (!currentUser) {
        return NextResponse.json({ currentUser: null });
    }

    // email, permissionFlg, role값을 Response
    return NextResponse.json({
        user: {
            email: currentUser.email,
            permissionFlg: currentUser.permissionFlg,
            role: currentUser.role,
        },
    });
}
