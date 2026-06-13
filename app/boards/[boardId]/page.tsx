// app/boards/[boardId]/page.tsx

import BoardClient from "@/components/BoardClient";
import { getDb } from "@/lib/db";
import { db_boards, db_images, db_memos } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function BoardPage({
    params,
}: {
    params: Promise<{ boardId: string }>;
}) {
    const db = getDb();
    const { boardId } = await params;
    const boardIdNumber = Number(boardId);

    const currentBoard = await db
        .select()
        .from(db_boards)
        .where(eq(db_boards.boardId, boardIdNumber))
        .orderBy(desc(db_boards.boardId))
        
    const allMemos = await db
        .select()
        .from(db_memos)
        .where(eq(db_memos.boardId, boardIdNumber));

    const allImages = await db
        .select()
        .from(db_images)
        .where(eq(db_images.boardId, boardIdNumber));

    const mappedMemos = allMemos.map((memo) => ({
        id: memo.id,
        boardId: memo.boardId,
        content: memo.content,
        x: memo.x,
        y: memo.y,
        width: memo.width,
        height: memo.height,
        color: memo.color,
        isPublic: memo.isPublic ?? false,
    }));

    const mappedImages = allImages.map((image) => ({
        imageId: image.imageId,
        boardId: image.boardId,
        publicId: image.publicId,
        secureUrl: image.secureUrl,
        fileName: image.fileName,
        x: image.x,
        y: image.y,
        width: image.width,
        height: image.height,
    }));

    return (
        <BoardClient
            currentBoard={currentBoard[0]}
            mappedImages={mappedImages}
            mappedMemos={mappedMemos}
        />
    );
}
