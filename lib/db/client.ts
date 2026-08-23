import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Neon(PostgreSQL) HTTP 드라이버. 서버리스(Vercel)에서 커넥션 없이 동작한다.
 * 사용: const sql = getSql(); const rows = await sql`SELECT ... WHERE user_sn = ${userSn}`
 */
let cached: NeonQueryFunction<false, false> | null = null;

export function getSql() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL 이 설정되지 않았습니다 (.env.local 확인)");
  }
  cached = neon(url);
  return cached;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
