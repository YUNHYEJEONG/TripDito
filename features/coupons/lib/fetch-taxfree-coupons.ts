import {
  TAXFREE_COUPON_SOURCE_URL,
  TAXFREE_COUPONS_FALLBACK,
} from "../data/taxfree-coupons";
import type { CouponsResponse } from "../types";
import { parseTaxFreeCouponHtml } from "./parse-taxfree-coupons";

export async function fetchTaxFreeCoupons(): Promise<CouponsResponse> {
  try {
    const res = await fetch(TAXFREE_COUPON_SOURCE_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TripDittoBot/1.0; +https://trip-ditto.local)",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`TAXFREE_HTTP_${res.status}`);
    }

    const html = await res.text();
    const { coupons, updatedAt } = parseTaxFreeCouponHtml(html);

    if (coupons.length === 0) {
      throw new Error("TAXFREE_EMPTY");
    }

    return {
      sourceUrl: TAXFREE_COUPON_SOURCE_URL,
      updatedAt,
      coupons,
      source: "live",
    };
  } catch {
    return {
      sourceUrl: TAXFREE_COUPON_SOURCE_URL,
      updatedAt: "2026-05-24",
      coupons: TAXFREE_COUPONS_FALLBACK,
      source: "fallback",
    };
  }
}
