import { NextResponse } from "next/server";
import { fetchTaxFreeCoupons } from "@/features/coupons/lib/fetch-taxfree-coupons";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await fetchTaxFreeCoupons();
  return NextResponse.json(data);
}
