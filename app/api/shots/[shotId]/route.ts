import { handleApi, readJson, requireUser } from "@/lib/server/api";
import {
  deleteShot,
  getShot,
  shotInputSchema,
  updateShot,
} from "@/lib/db/shots";

type Ctx = { params: Promise<{ shotId: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    return getShot(user.userSn, (await params).shotId);
  });
}

export async function PUT(request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    const input = shotInputSchema.parse(await readJson(request));
    return updateShot(user.userSn, (await params).shotId, input);
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    await deleteShot(user.userSn, (await params).shotId);
    return { ok: true };
  });
}
