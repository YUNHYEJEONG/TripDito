import "server-only";
import { DEFAULT_MARKET, type Market } from "./market";

export type PriceLookup = {
  price: number;
  currency: string;
  source: string;
  link: string | null;
  sampleCount: number;
};

export function isSerpApiConfigured() {
  return Boolean(process.env.SERPAPI_API_KEY?.trim());
}

type ShoppingResult = {
  title?: string;
  extracted_price?: number;
  price?: string;
  source?: string;
  link?: string;
  product_link?: string;
};

function parsePrice(raw: string | undefined) {
  if (!raw) return null;
  const value = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** 묶음·대용량 판매(예: "10個セット", "x12", "ケース")는 단품 가격 추정에서 제외 */
const BULK_PATTERN =
  /(\d+\s*(個|本|袋|箱|枚|セット|入り?|pcs?|pack|件|支|盒|包)|ケース|まとめ買い|業務用|x\s?\d{2,}|×\s?\d{2,})/i;

/** Google Shopping(여행지 국가) 상위 결과 가격의 중앙값. 결과 없으면 null. */
export async function lookupPrice(
  query: string,
  market: Market = DEFAULT_MARKET,
): Promise<PriceLookup | null> {
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey || !query.trim()) return null;

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", query);
  url.searchParams.set("gl", market.gl);
  url.searchParams.set("hl", market.hl);
  url.searchParams.set("num", "10");
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`SERPAPI_${res.status}`);
  const json = (await res.json()) as { shopping_results?: ShoppingResult[] };

  const all: { price: number; source: string; link: string | null; bulk: boolean }[] = [];
  for (const r of json.shopping_results ?? []) {
    const price = r.extracted_price ?? parsePrice(r.price);
    if (typeof price === "number" && price > 0) {
      all.push({
        price,
        source: r.source ?? "",
        link: r.product_link ?? r.link ?? null,
        bulk: BULK_PATTERN.test(r.title ?? ""),
      });
    }
  }
  // 단품으로 보이는 결과를 우선하고, 전부 묶음이면 그대로 사용
  const singles = all.filter((c) => !c.bulk);
  const candidates = (singles.length ? singles : all).slice(0, 8);
  if (!candidates.length) return null;

  const sorted = [...candidates].sort((a, b) => a.price - b.price);
  const median = sorted[Math.floor(sorted.length / 2)];
  return {
    price: Math.round(median.price),
    currency: market.currency,
    source: median.source,
    link: median.link,
    sampleCount: candidates.length,
  };
}
