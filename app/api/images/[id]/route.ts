import { getDb } from "@/lib/db";
import { getCurrentUserFromRequest, getMemoPermissionMessage } from "@/lib/auth/current-user";
import { db_images } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

// 이미지 수정 API - PATCH 요청을 처리하여 특정 ID의 이미지 위치와 크기를 업데이트
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
    const currentUser = await getCurrentUserFromRequest(request);
    const permissionMessage = getMemoPermissionMessage(currentUser);

    if (permissionMessage) {
        return NextResponse.json({
            ok: false,
            message: permissionMessage,
        },{ status: 403 });
    }

    const db = getDb();
    const { id } = await params;
    const body = await request.json();
    const updates: Partial<typeof db_images.$inferInsert> = {};
    const imageId = Number(id);
    if (!Number.isInteger(imageId)) {
        return NextResponse.json({
            ok: false,
            message: "Invalid image id.",
        }, { status: 400 });
    }

    // 업데이트할 필드가 요청 본문에 존재하는 경우에만 업데이트 객체에 추가
    if (body.boardId !== undefined) updates.boardId = body.boardId;
    if (body.publicId !== undefined) updates.publicId = body.publicId;
    if (body.secureUrl !== undefined) updates.secureUrl = body.secureUrl;
    if (body.fileName !== undefined) updates.fileName = body.fileName;
    if (body.x !== undefined) updates.x = body.x;
    if (body.y !== undefined) updates.y = body.y;
    if (body.width !== undefined) updates.width = body.width;
    if (body.height !== undefined) updates.height = body.height;
    
    if (Object.keys(updates).length === 0) {
        return NextResponse.json({
            ok: false,
            message: "No update fields were provided.",
        }, { status: 400 });
    }
    
    const updatedImage = await db
        .update(db_images)
        .set(updates)
        .where(eq(db_images.imageId, imageId))
        .returning();

    if (!updatedImage[0]) {
    return NextResponse.json({
        ok: false,
        message: "Image does not exist.",
    }, { status: 404 });
    }
        

    return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        console.error("Error updating image:", error);
        return NextResponse.json({
            ok: false,
            message: "An error occurred while updating the image.",
        },{ status: 500 });
    }
}

// 이미지 삭제 API - DELETE 요청을 처리하여 Cloudinary 이미지와 DB 데이터를 삭제
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
    const currentUser = await getCurrentUserFromRequest(request);
    const permissionMessage = getMemoPermissionMessage(currentUser);

    if (permissionMessage) {
        return NextResponse.json({
            ok: false,
            message: permissionMessage,
        },{ status: 403 });
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
    const imageId = Number(id);
    if (!Number.isInteger(imageId)) {
        return NextResponse.json({
            ok: false,
            message: "Invalid image id.",
        }, { status: 400 });
    }

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

    return NextResponse.json({
            ok: true 
        }, { status: 200 });
    } catch (error) {
        console.error("Error deleting image:", error);
        return NextResponse.json({
            ok: false,
            message: "An error occurred while deleting the image.",
        }, { status: 500 });
    }
}
