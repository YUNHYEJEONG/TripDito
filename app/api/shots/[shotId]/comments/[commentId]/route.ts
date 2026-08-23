import { handleApi, requireUser } from "@/lib/server/api";
import { deleteComment } from "@/lib/db/shots";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ shotId: string; commentId: string }> },
) {
  return handleApi(async () => {
    const user = await requireUser();
    const { shotId, commentId } = await params;
    await deleteComment(user.userSn, shotId, commentId);
    return { ok: true };
  });
}
