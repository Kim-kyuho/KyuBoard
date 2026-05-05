// app/boards/[boardId]/page.tsx

import BoardClient from "@/components/BoardClient";
import { getDb } from "@/lib/db";
import { db_boards, db_memos } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";

export default async function BoardPage({
    params,
}: {
    params: Promise<{ boardId: string }>;
}) {
    const db = getDb();
    const { boardId } = await params;
    const boardIdNumber = Number(boardId);

    const allBoards = await db
        .select({ boardId: db_boards.boardId })
        .from(db_boards)
        .orderBy(asc(db_boards.boardId));

    const currentBoard = await db
        .select()
        .from(db_boards)
        .where(eq(db_boards.boardId, boardIdNumber))
        .orderBy(desc(db_boards.boardId))
        
    const allMemos = await db
        .select()
        .from(db_memos)
        .where(eq(db_memos.boardId, boardIdNumber));

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

    return (
        <BoardClient
            boardIds={allBoards.map((board) => board.boardId)}
            currentBoard={currentBoard[0]}
            mappedMemos={mappedMemos}
        />
    );
}
