import { handleApi, requireUser } from "@/lib/server/api";
import { syncCouponsFromSource } from "@/lib/db/coupons";

/** 외부 쿠폰 사이트 → CPN_INFO / CPN_REGN_INFO 배치 적재 (관리·크론용) */
export async function POST() {
  return handleApi(async () => {
    await requireUser();
    return syncCouponsFromSource();
  });
}
