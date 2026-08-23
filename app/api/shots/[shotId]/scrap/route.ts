import { handleApi, requireUser } from "@/lib/server/api";
import { toggleScrap } from "@/lib/db/shots";

/** 스크랩 토글 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ shotId: string }> },
) {
  return handleApi(async () => {
    const user = await requireUser();
    return toggleScrap(user.userSn, (await params).shotId);
  });
}
