import { handleApi, readJson, requireUser } from "@/lib/server/api";
import { addComment, commentInputSchema, listComments } from "@/lib/db/shots";

type Ctx = { params: Promise<{ shotId: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    return listComments(user.userSn, (await params).shotId);
  });
}

/** 댓글/대댓글 작성 { text, parentId? } */
export async function POST(request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    const input = commentInputSchema.parse(await readJson(request));
    return addComment(user.userSn, (await params).shotId, input);
  }, 201);
}
