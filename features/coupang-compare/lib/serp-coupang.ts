import { isSerpApiConfigured } from "@/features/image-analysis/google-lens";

export type CoupangSearchCandidate = {
  title: string;
  unitPriceKrw: number;
  url: string;
  source: string;
};

export type CoupangSearchResult = {
  deal: CoupangSearchCandidate | null;
  candidatesChecked: number;
};

type SerpShoppingResult = {
  title?: string;
  link?: string;
  product_link?: string;
  source?: string;
  price?: string;
  extracted_price?: number;
};

/** 여행 통화 → KRW. 고정 환율로 저가 알림을 오판하지 않도록 최신 공개 환율만 쓴다. */
export async function estimateToKrw(
  amount: number,
  currency: string,
): Promise<number> {
  const code = currency.trim().toUpperCase();
  if (!Number.isFinite(amount) || amount < 0) return 0;
  if (code === "KRW") return Math.round(amount);
  if (!/^[A-Z]{3}$/.test(code)) throw new Error("INVALID_CURRENCY");

  const providers = [
    `https://api.frankfurter.app/latest?amount=1&from=${encodeURIComponent(code)}&to=KRW`,
    `https://open.er-api.com/v6/latest/${encodeURIComponent(code)}`,
  ];

  for (const url of providers) {
    try {
      const res = await fetch(url, { next: { revalidate: 60 * 60 } });
      if (!res.ok) continue;
      const body = (await res.json()) as {
        rates?: Record<string, number>;
      };
      const rate = body.rates?.KRW;
      if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
        return Math.round(amount * rate);
      }
    } catch {
      // 다음 공개 환율 공급자로 시도한다.
    }
  }

  throw new Error(`FX_RATE_UNAVAILABLE:${code}`);
}

function isCoupangSource(source: string, link: string): boolean {
  const hay = `${source} ${link}`.toLowerCase();
  return hay.includes("coupang") || hay.includes("쿠팡");
}

function isSafeHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function buildQuery(name: string, memo?: string): string {
  const parts = [name.trim()];
  const memoTrim = memo?.trim();
  if (memoTrim) {
    // 용량·그램 힌트가 메모에 있으면 검색어에 덧붙임
    const capacity = memoTrim.match(
      /\d+\s*(g|kg|ml|l|그램|킬로|팩|개입|입)/i,
    );
    if (capacity) parts.push(capacity[0].replace(/\s+/g, ""));
  }
  parts.push("쿠팡");
  return parts.filter(Boolean).join(" ");
}

/**
 * SerpAPI Google Shopping → 쿠팡 결과만 필터.
 * estimatedUnitPriceKrw보다 저렴한 최저가 1건 반환.
 */
export async function searchCheaperCoupangDeal(input: {
  name: string;
  memo?: string;
  estimatedUnitPriceKrw: number;
}): Promise<CoupangSearchResult> {
  if (!isSerpApiConfigured()) {
    throw new Error("SERPAPI_NOT_CONFIGURED");
  }
  const apiKey = process.env.SERPAPI_API_KEY!.trim();
  const q = buildQuery(input.name, input.memo);

  const params = new URLSearchParams({
    engine: "google_shopping",
    q,
    api_key: apiKey,
    gl: "kr",
    hl: "ko",
    location: "South Korea",
  });

  const res = await fetch(
    `https://serpapi.com/search.json?${params.toString()}`,
    { method: "GET", cache: "no-store" },
  );

  const body = (await res.json()) as {
    error?: string;
    shopping_results?: SerpShoppingResult[];
  };

  if (!res.ok) {
    throw new Error(body.error ?? `SERPAPI_HTTP_${res.status}`);
  }
  if (body.error) {
    throw new Error(body.error);
  }

  const results = body.shopping_results ?? [];
  const coupang: CoupangSearchCandidate[] = [];

  for (const row of results) {
    const title = row.title?.trim();
    const url = (row.product_link ?? row.link)?.trim();
    const source = row.source?.trim() ?? "";
    if (!title || !url || !isSafeHttpsUrl(url)) continue;
    if (!isCoupangSource(source, url)) continue;

    const price =
      typeof row.extracted_price === "number"
        ? row.extracted_price
        : parsePriceText(row.price);
    if (price == null || price <= 0) continue;

    coupang.push({
      title,
      unitPriceKrw: Math.round(price),
      url,
      source: source || "쿠팡",
    });
  }

  // 배송비·환율 시차로 인한 거짓 알림을 줄이기 위해 5% 이상 저렴할 때만 알린다.
  const cheaper = coupang
    .filter((c) => c.unitPriceKrw <= input.estimatedUnitPriceKrw * 0.95)
    .sort((a, b) => a.unitPriceKrw - b.unitPriceKrw);

  return {
    deal: cheaper[0] ?? null,
    candidatesChecked: coupang.length,
  };
}

function parsePriceText(text: string | undefined): number | null {
  if (!text) return null;
  const digits = text.replace(/[^\d.]/g, "");
  if (!digits) return null;
  const value = Number(digits);
  return Number.isFinite(value) ? value : null;
}
