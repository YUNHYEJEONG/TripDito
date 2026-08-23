import { handleApi, readJson, requireUser } from "@/lib/server/api";
import {
  deleteItem,
  getItem,
  itemInputSchema,
  updateItem,
} from "@/lib/db/items";

type Ctx = { params: Promise<{ itemId: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    return getItem(user.userSn, (await params).itemId);
  });
}

export async function PUT(request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    const input = itemInputSchema.parse(await readJson(request));
    return updateItem(user.userSn, (await params).itemId, input);
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    await deleteItem(user.userSn, (await params).itemId);
    return { ok: true };
  });
}
