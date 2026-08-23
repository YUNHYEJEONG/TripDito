import { handleApi, requireUser } from "@/lib/server/api";
import { listScraps } from "@/lib/db/shots";

/** 프로필 > 내 스크랩 */
export async function GET(request: Request) {
  return handleApi(async () => {
    const user = await requireUser();
    const p = new URL(request.url).searchParams;
    return listScraps(
      user.userSn,
      Number(p.get("limit") ?? 50),
      Number(p.get("offset") ?? 0),
    );
  });
}
