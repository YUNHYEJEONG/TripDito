/**
 * R2 버킷 CORS 설정: `npm run r2:cors`
 * 브라우저가 presigned URL 로 직접 PUT 하려면 버킷에 CORS 규칙이 있어야 한다.
 * 허용 origin: http://localhost:3000 + NEXT_PUBLIC_SITE_URL (+ 인자로 추가 가능)
 *   예) npm run r2:cors -- https://tripdito-git-feature-logo-xxx.vercel.app
 */
import { putBucketCors } from "./lib/r2";

async function main() {
  const origins = new Set<string>(["http://localhost:3000"]);
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (site) origins.add(site);
  for (const arg of process.argv.slice(2)) origins.add(arg.replace(/\/$/, ""));

  await putBucketCors([...origins]);
  console.log("R2 CORS 설정 완료:", [...origins].join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
