import "server-only";
import { DEFAULT_MARKET, roundPrice, type Market } from "./market";

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

/**
 * SerpAPI 는 캐시 미스·크롤 실패 시 503 "couldn't get valid results" 를 간헐적으로 돌려준다.
 * 같은 검색어를 잠깐 뒤 다시 요청하면 대개 성공하므로 짧게 재시도한다.
 */
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1_200;
/** 요청 1회 상한. 캐시 미스(실시간 크롤)면 10초 넘게 걸리기도 한다 */
const REQUEST_TIMEOUT_MS = 15_000;
/** 남은 시간이 이보다 적으면 새 요청을 시작하지 않는다 */
const MIN_REMAINING_MS = 3_000;

export type LookupOptions = {
  /** 이 시각(epoch ms)까지 답이 없으면 포기한다. 분석 라우트 전체 제한(60s) 안에 끝내기 위한 예산 */
  deadline?: number;
};

/** 예산이 다 되어 조회를 건너뛰었을 때의 오류 코드 */
export const DEADLINE_ERROR = "SERPAPI_DEADLINE";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function remainingMs(deadline?: number) {
  return deadline === undefined ? Infinity : deadline - Date.now();
}

async function fetchShopping(
  query: string,
  market: Market,
  apiKey: string,
  deadline?: number,
): Promise<ShoppingResult[]> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", query);
  url.searchParams.set("gl", market.gl);
  url.searchParams.set("hl", market.hl);
  url.searchParams.set("num", "10");
  url.searchParams.set("api_key", apiKey);

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const remaining = remainingMs(deadline);
    if (remaining < MIN_REMAINING_MS) throw new Error(DEADLINE_ERROR);
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(Math.min(REQUEST_TIMEOUT_MS, remaining)),
      });
      const json = (await res.json().catch(() => ({}))) as {
        shopping_results?: ShoppingResult[];
        error?: string;
      };
      if (res.ok) return json.shopping_results ?? [];
      // 401/403(키)·429(쿼터 소진)는 재시도해도 소용없다
      if (res.status === 401 || res.status === 403 || res.status === 429) {
        throw new Error(`SERPAPI_${res.status}`);
      }
      // "no results" 계열(400/404)은 결과 없음으로 처리해 다음 검색어로 넘어간다
      if (/no results|hasn't returned any results/i.test(json.error ?? "")) {
        return [];
      }
      lastError = new Error(`SERPAPI_${res.status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/^SERPAPI_(401|403|429)$/.test(message)) throw error;
      lastError = error;
    }
    if (attempt < MAX_ATTEMPTS) {
      const delay = RETRY_DELAY_MS * attempt;
      if (remainingMs(deadline) - delay < MIN_REMAINING_MS) break;
      await sleep(delay);
    }
  }
  throw lastError;
}

function pickMedian(results: ShoppingResult[], market: Market): PriceLookup | null {
  const all: { price: number; source: string; link: string | null; bulk: boolean }[] = [];
  for (const r of results) {
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
    price: roundPrice(median.price, market.currency),
    currency: market.currency,
    source: median.source,
    link: median.link,
    sampleCount: candidates.length,
  };
}

/** Google Shopping(여행지 국가) 상위 결과 가격의 중앙값. 결과 없으면 null. */
export async function lookupPrice(
  query: string,
  market: Market = DEFAULT_MARKET,
  options: LookupOptions = {},
): Promise<PriceLookup | null> {
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey || !query.trim()) return null;
  return pickMedian(
    await fetchShopping(query.trim(), market, apiKey, options.deadline),
    market,
  );
}

/** 용량·개수 토큰을 떼어낸 더 짧은 검색어 (정확 검색이 비면 넓혀서 다시 찾는다) */
export function simplifyQuery(query: string) {
  return query
    .replace(
      /\d+(\.\d+)?\s*(ml|mL|L|g|kg|oz|粒|個|枚|本|袋|箱|入り?|pcs?|pack|개입|개|매|정|포)(?![A-Za-z])/g,
      "",
    )
    .replace(/[()（）\[\]【】]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
