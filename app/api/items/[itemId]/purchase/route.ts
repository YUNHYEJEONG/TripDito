import { handleApi, requireUser } from "@/lib/server/api";
import { togglePurchased } from "@/lib/db/items";

/** 구매 여부 토글 (PRCHS_DTTM NULL ↔ now()) */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  return handleApi(async () => {
    const user = await requireUser();
    return togglePurchased(user.userSn, (await params).itemId);
  });
}
