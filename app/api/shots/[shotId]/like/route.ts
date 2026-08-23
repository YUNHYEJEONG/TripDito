import { handleApi, requireUser } from "@/lib/server/api";
import { toggleLike } from "@/lib/db/shots";

/** 좋아요 토글 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ shotId: string }> },
) {
  return handleApi(async () => {
    const user = await requireUser();
    return toggleLike(user.userSn, (await params).shotId);
  });
}
