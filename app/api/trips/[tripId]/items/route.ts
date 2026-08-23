import { handleApi, readJson, requireUser } from "@/lib/server/api";
import { createItem, itemInputSchema, listItems } from "@/lib/db/items";

type Ctx = { params: Promise<{ tripId: string }> };

/** 여행의 쇼핑리스트 */
export async function GET(_request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    return listItems(user.userSn, (await params).tripId);
  });
}

/** 쇼핑품목 추가 */
export async function POST(request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    const input = itemInputSchema.parse(await readJson(request));
    return createItem(user.userSn, (await params).tripId, input);
  }, 201);
}
