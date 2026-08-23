import "server-only";

export type PriceLookup = {
  price: number;
  currency: "JPY";
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

function parseYen(raw: string | undefined) {
  if (!raw) return null;
  const value = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Google Shopping(일본) 상위 결과 가격의 중앙값. 결과 없으면 null. */
export async function lookupPriceJp(query: string): Promise<PriceLookup | null> {
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey || !query.trim()) return null;

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", query);
  url.searchParams.set("gl", "jp");
  url.searchParams.set("hl", "ja");
  url.searchParams.set("num", "10");
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`SERPAPI_${res.status}`);
  const json = (await res.json()) as { shopping_results?: ShoppingResult[] };

  const candidates: { price: number; source: string; link: string | null }[] = [];
  for (const r of json.shopping_results ?? []) {
    const price = r.extracted_price ?? parseYen(r.price);
    if (typeof price === "number" && price > 0) {
      candidates.push({ price, source: r.source ?? "", link: r.product_link ?? r.link ?? null });
    }
    if (candidates.length >= 8) break;
  }
  if (!candidates.length) return null;

  const sorted = [...candidates].sort((a, b) => a.price - b.price);
  const median = sorted[Math.floor(sorted.length / 2)];
  return {
    price: Math.round(median.price),
    currency: "JPY",
    source: median.source,
    link: median.link,
    sampleCount: candidates.length,
  };
}
