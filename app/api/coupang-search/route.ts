import { NextResponse } from "next/server";
import {
  estimateToKrw,
  searchCheaperCoupangDeal,
} from "@/features/coupang-compare/lib/serp-coupang";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type CoupangSearchBody = {
  name?: string;
  memo?: string;
  estimatedPrice?: number;
  currency?: string;
  quantity?: number;
};

export async function POST(request: Request) {
  let body: CoupangSearchBody;
  try {
    body = (await request.json()) as CoupangSearchBody;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "MISSING_NAME" }, { status: 400 });
  }

  const estimatedPrice = Number(body.estimatedPrice);
  if (!Number.isFinite(estimatedPrice) || estimatedPrice < 0) {
    return NextResponse.json({ error: "INVALID_PRICE" }, { status: 400 });
  }

  const currency = (body.currency ?? "KRW").trim() || "KRW";
  const estimatedUnitPriceKrw = estimateToKrw(estimatedPrice, currency);

  try {
    const result = await searchCheaperCoupangDeal({
      name,
      memo: body.memo,
      estimatedUnitPriceKrw,
    });
    return NextResponse.json({
      deal: result.deal,
      candidatesChecked: result.candidatesChecked,
      estimatedUnitPriceKrw,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "COUPANG_SEARCH_FAILED";
    console.error("[coupang-search]", message);
    const status = message === "SERPAPI_NOT_CONFIGURED" ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
