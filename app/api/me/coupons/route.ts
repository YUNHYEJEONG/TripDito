import { z } from "zod";
import { handleApi, readJson, requireUser } from "@/lib/server/api";
import { listReceivedCoupons, receiveCoupon } from "@/lib/db/coupons";

/** 프로필 > 내가 받은 쿠폰 */
export async function GET() {
  return handleApi(async () =>
    listReceivedCoupons((await requireUser()).userSn),
  );
}

/** 쿠폰 받기 { couponId } */
export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await requireUser();
    const { couponId } = z
      .object({ couponId: z.string() })
      .parse(await readJson(request));
    return receiveCoupon(user.userSn, couponId);
  }, 201);
}
