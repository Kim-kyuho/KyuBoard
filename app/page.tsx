
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { db_memos } from "@/lib/db/schema";
import BoardClient from "@/components/BoardClient";


export default async function Home() {
  await connection();
  const db = getDb();
  const allMemos = await db.select().from(db_memos);
  const mappedMemos = allMemos.map((memo)=>({
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
    <BoardClient mappedMemos={mappedMemos} />
  );
}
