import { getDb } from "@/lib/db";
import { db_users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server"
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// 패스워드를 Hasing하는 기능: 랜덤salt와 패스워드를 조합해 다시 Hasing
async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
}

// SignUp을 위한 API - Users테이블에 유저 정보를 등록
export async function POST(request: NextRequest) {
    const db = getDb();
    const body = await request.json();
    const email = String(body.email ?? "");
    const password = String(body.password ?? "");

    // 이메일 포멧 체크
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // 패스워드 형식 체크
    if (
        password.length < 10 ||
        !/[A-Za-z]/.test(password) ||
        !/[0-9]/.test(password)
    ) {
        return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    // 이메일이 존재하는 지 체크
    const existingUser = await db
    .select({ id: db_users.id })
    .from(db_users)
    .where(eq(db_users.email, email))
    .limit(1);

    if (existingUser.length > 0) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // DB에 유저 정보를 Insert
    const newUser = await db
    .insert(db_users)
    .values({
        email,
        passwordHash,
        permissionFlg: false,
        role: "user"
    }).returning();

    return NextResponse.json({ user: newUser[0]})


    
}
