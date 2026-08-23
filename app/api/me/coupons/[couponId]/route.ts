import { handleApi, requireUser } from "@/lib/server/api";
import { removeReceivedCoupon } from "@/lib/db/coupons";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ couponId: string }> },
) {
  return handleApi(async () => {
    const user = await requireUser();
    await removeReceivedCoupon(user.userSn, (await params).couponId);
    return { ok: true };
  });
}
