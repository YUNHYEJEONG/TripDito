import { handleApi, readJson, requireUser } from "@/lib/server/api";
import {
  createShot,
  listShots,
  shotInputSchema,
  shotQuerySchema,
} from "@/lib/db/shots";

/**
 * 때샷 피드.
 * query: channel=shots|community, sort=newest|likes, country=JP, city=오사카, author=me|<uuid>, limit, offset
 */
export async function GET(request: Request) {
  return handleApi(async () => {
    const user = await requireUser();
    const q = shotQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return listShots(user.userSn, q);
  });
}

/** 때샷 업로드 (이미지는 /api/uploads 로 R2에 먼저 올린 뒤 attachmentId 전달) */
export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await requireUser();
    const input = shotInputSchema.parse(await readJson(request));
    return createShot(user.userSn, input);
  }, 201);
}
