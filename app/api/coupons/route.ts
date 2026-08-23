import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/client";
import { listCoupons } from "@/lib/db/coupons";
import { fetchTaxFreeCoupons } from "@/features/coupons/lib/fetch-taxfree-coupons";
import { TAXFREE_COUPON_SOURCE_URL } from "@/features/coupons/data/taxfree-coupons";

export const dynamic = "force-dynamic";

/**
 * 쿠폰 목록 (?country=JP 필터).
 * CPN_INFO 에 적재된 쿠폰이 있으면 DB에서 서빙하고(정의서 p.31 "배치로 적재하고 DB에서 서빙"),
 * 비어 있으면 기존처럼 외부 파싱/폴백으로 응답한다.
 */
export async function GET(request: Request) {
  const country =
    new URL(request.url).searchParams.get("country") ?? undefined;
  if (isDatabaseConfigured()) {
    try {
      const coupons = await listCoupons({ country });
      if (coupons.length > 0) {
        return NextResponse.json({
          sourceUrl: TAXFREE_COUPON_SOURCE_URL,
          updatedAt: null,
          coupons,
          source: "db",
        });
      }
    } catch (error) {
      console.error("[coupons] DB 조회 실패, 외부 소스로 폴백", error);
    }
  }
  return NextResponse.json(await fetchTaxFreeCoupons());
}
