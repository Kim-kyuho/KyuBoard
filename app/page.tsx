import BoardList from "@/components/BoardList";
import { getDb } from "@/lib/db";
import { db_boards } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export default async function Home() {
  const db = getDb();
  const boards = await db
      .select({
          boardId: db_boards.boardId,
          title: db_boards.title,
          width: db_boards.width,
          height: db_boards.height,
      })
      .from(db_boards)
      .orderBy(asc(db_boards.boardId));

  return <BoardList boards={boards} />;
}
