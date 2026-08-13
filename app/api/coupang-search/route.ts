import { NextResponse } from "next/server";
import {
  estimateToKrw,
  searchCheaperCoupangDeal,
} from "@/features/coupang-compare/lib/serp-coupang";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

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

  const name = body.name?.trim().slice(0, 160);
  if (!name) {
    return NextResponse.json({ error: "MISSING_NAME" }, { status: 400 });
  }

  const estimatedPrice = Number(body.estimatedPrice);
  if (!Number.isFinite(estimatedPrice) || estimatedPrice < 0) {
    return NextResponse.json({ error: "INVALID_PRICE" }, { status: 400 });
  }

  const currency = (body.currency ?? "KRW").trim().toUpperCase() || "KRW";
  if (!/^[A-Z]{3}$/.test(currency)) {
    return NextResponse.json({ error: "INVALID_CURRENCY" }, { status: 400 });
  }
  if (estimatedPrice === 0) {
    return NextResponse.json({
      deal: null,
      candidatesChecked: 0,
      estimatedUnitPriceKrw: 0,
    });
  }

  try {
    const estimatedUnitPriceKrw = await estimateToKrw(
      estimatedPrice,
      currency,
    );
    const result = await searchCheaperCoupangDeal({
      name,
      memo: body.memo?.slice(0, 300),
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
    const status =
      message === "SERPAPI_NOT_CONFIGURED" ||
      message.startsWith("FX_RATE_UNAVAILABLE")
        ? 503
        : 502;
    return NextResponse.json(
      {
        error:
          message === "SERPAPI_NOT_CONFIGURED"
            ? "SEARCH_NOT_CONFIGURED"
            : message.startsWith("FX_RATE_UNAVAILABLE")
              ? "RATE_UNAVAILABLE"
              : "COUPANG_SEARCH_FAILED",
      },
      { status },
    );
  }
}
