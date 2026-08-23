/**
 * DB 스키마/공통코드 시드 적용: `npm run db:migrate`
 * .env.local 의 DATABASE_URL 을 사용한다. (재실행 안전)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 이 설정되지 않았습니다 (.env.local)");
  // 다중 문장 스크립트는 HTTP 드라이버(prepared statement)로 실행할 수 없어
  // WebSocket Client 의 simple query 를 사용한다.
  const client = new Client(url);
  await client.connect();
  try {
    for (const file of ["schema.sql", "seed-codes.sql"]) {
      const text = readFileSync(resolve(process.cwd(), "db", file), "utf8");
      console.log(`> applying db/${file}`);
      await client.query(text);
    }

    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name`,
    );
    console.log(
      `OK tables (${rows.length}):`,
      rows.map((t) => t.table_name).join(", "),
    );
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
