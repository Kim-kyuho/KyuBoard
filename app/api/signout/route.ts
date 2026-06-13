import { sessionCookieName } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const response = NextResponse.json({ 
            ok: true 
        }, { status: 200 });
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
