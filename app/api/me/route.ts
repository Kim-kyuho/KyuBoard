import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { NextRequest, NextResponse } from "next/server";

// 유져 정보를 얻기위한 API
export async function GET(request: NextRequest) {
    try {
        // Request로부터 유저 정보를 GET
        const currentUser = await getCurrentUserFromRequest(request);

        // 유저 정보가 존재하지 않을 경우 null를 Response
        if (!currentUser) {
            return NextResponse.json({ 
                user: null 
            },{ status: 200 });
        }

        // email, permissionFlg, role값을 Response
        return NextResponse.json({
            user: {
                email: currentUser.email,
                permissionFlg: currentUser.permissionFlg,
                role: currentUser.role,
            },
        },{ status: 200 });
    } catch (error) {
        console.error("Error fetching current user:", error);
        return NextResponse.json({
            ok: false,
            message: "An error occurred while fetching the current user.",
        },{ status: 500 });
    }
}