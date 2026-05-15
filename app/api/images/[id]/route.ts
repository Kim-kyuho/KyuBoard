import { getDb } from "@/lib/db";
import { getCurrentUserFromRequest, getMemoPermissionMessage } from "@/lib/auth/current-user";
import { db_images } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

// 이미지 수정 API - PATCH 요청을 처리하여 특정 ID의 이미지 위치와 크기를 업데이트
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const currentUser = await getCurrentUserFromRequest(request);
    const permissionMessage = getMemoPermissionMessage(currentUser);

    if (permissionMessage) {
        return NextResponse.json({
            ok: false,
            message: permissionMessage,
        });
    }

    const db = getDb();
    const { id } = await params;
    const body = await request.json();
    const updates: Partial<typeof db_images.$inferInsert> = {};

    // 업데이트할 필드가 요청 본문에 존재하는 경우에만 업데이트 객체에 추가
    if (body.boardId !== undefined) updates.boardId = body.boardId;
    if (body.publicId !== undefined) updates.publicId = body.publicId;
    if (body.secureUrl !== undefined) updates.secureUrl = body.secureUrl;
    if (body.fileName !== undefined) updates.fileName = body.fileName;
    if (body.x !== undefined) updates.x = body.x;
    if (body.y !== undefined) updates.y = body.y;
    if (body.width !== undefined) updates.width = body.width;
    if (body.height !== undefined) updates.height = body.height;

    await db
        .update(db_images)
        .set(updates)
        .where(eq(db_images.imageId, parseInt(id)));

    return NextResponse.json({ ok: true });
}

// 이미지 삭제 API - DELETE 요청을 처리하여 Cloudinary 이미지와 DB 데이터를 삭제
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const currentUser = await getCurrentUserFromRequest(request);
    const permissionMessage = getMemoPermissionMessage(currentUser);

    if (permissionMessage) {
        return NextResponse.json({
            ok: false,
            message: permissionMessage,
        });
    }
    if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
    ) {
        return NextResponse.json({
            ok: false,
            message: "Cloudinary environment variables are not set.",
        }, { status: 500 });
    }

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const db = getDb();
    const { id } = await params;
    const imageId = parseInt(id);

    const image = await db
        .select()
        .from(db_images)
        .where(eq(db_images.imageId, imageId));

    if (image.length === 0) {
        return NextResponse.json({
            ok: false,
            message: "Image does not exist.",
        }, { status: 404 });
    }

    await cloudinary.uploader.destroy(image[0].publicId);

    await db
        .delete(db_images)
        .where(eq(db_images.imageId, imageId));

    return NextResponse.json({ ok: true });
}
