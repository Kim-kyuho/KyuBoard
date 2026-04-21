import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const db_boards = pgTable("boards", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    ownerId : integer("owner_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const db_memos = pgTable("memos", {
    id: serial("id").primaryKey(),
    boardId : integer("board_id").references(() => db_boards.id).notNull(),
    content: text("content").notNull(),
    x: integer("x").notNull(),
    y: integer("y").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    color: text("color").notNull(),
    isPublic: boolean("is_public").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});