import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Neon 데이터베이스 연결 설정
const connectionString = process.env.NEON_CONNECTION_STRING || "";
const client = neon(connectionString);

// Drizzle ORM 인스턴스 생성
export const db = drizzle(client);  