import "server-only";
import { detectItemsInImage, type DetectedItem } from "./gemini";
import {
  DEADLINE_ERROR,
  isSerpApiConfigured,
  lookupPrice,
  simplifyQuery,
  type PriceLookup,
} from "./serpapi";
import { DEFAULT_MARKET, roundPrice, type Market } from "./market";

export type AnalyzedItem = DetectedItem & {
  sourceImageId: string;
  estimatedPrice: number;
  /** image: 사진에서 읽음 · search: 쇼핑 검색 중앙값 · estimate: 모델 추정 · none: 못 찾음 */
  priceSource: "image" | "search" | "estimate" | "none";
  priceLink: string | null;
};

export type AnalyzeImagesResult = {
  items: AnalyzedItem[];
  priceSearchEnabled: boolean;
  /** 분석에 실패한 사진 (쿼터 초과·타임아웃·안전 필터 등). 성공한 사진 결과는 items 에 포함 */
  failures: { imageId: string; reason: string }[];
  market: { countryCode: string; currency: string };
};

/** 모델·검색 API 분당 제한을 넘기지 않도록 동시 호출 수를 묶는다 */
const GEMINI_CONCURRENCY = 2;
const PRICE_CONCURRENCY = 3;
/** 품목 하나에 시도할 검색어 수 상한 (SerpAPI 쿼터 보호) */
const MAX_QUERIES_PER_ITEM = 3;
/**
 * 요청 시작부터 가격 검색을 끝내야 하는 시각. 라우트 상한(60s)에서 응답 직렬화 여유를 뺀 값.
 * 예산이 다하면 남은 품목은 모델 추정가(typicalPrice)로 채운다.
 */
const PRICE_DEADLINE_MS = 50_000;

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function reasonOf(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/429|RESOURCE_EXHAUSTED/i.test(message)) return "RATE_LIMITED";
  if (/abort|timeout/i.test(message)) return "TIMEOUT";
  if (/GEMINI_EMPTY_/.test(message)) return message;
  return "ANALYSIS_FAILED";
}

/** 검색어 후보: 현지어 정확 검색 → 영어 → 현지어 간략(용량 제거) → 영어 간략 → 브랜드+원문. 중복 제거 */
export function searchQueriesFor(
  d: Pick<DetectedItem, "searchQuery" | "searchQueryEn" | "brand" | "nameOriginal">,
) {
  const raw = [
    d.searchQuery,
    d.searchQueryEn,
    simplifyQuery(d.searchQuery),
    simplifyQuery(d.searchQueryEn),
    [d.brand, d.nameOriginal].filter(Boolean).join(" "),
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of raw) {
    const trimmed = q.trim();
    const key = trimmed.toLowerCase();
    if (key.length < 2 || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out.slice(0, MAX_QUERIES_PER_ITEM);
}

/**
 * 1단계: Gemini 가 사진에서 품목을 뽑고(OCR 포함),
 * 2단계: 사진에 가격이 없는 품목은 SerpAPI(Google Shopping) 로 가격을 찾는다.
 *   현지어 검색이 비거나 일시 오류(503)면 영어·간략 검색어로 이어서 시도하고,
 *   그래도 없으면 모델이 추정한 일반 소매가(typicalPrice)를 쓴다. 0원은 정말 아무것도 못 찾았을 때만.
 * 여행지(market)에 따라 프롬프트 언어·통화·검색 지역이 바뀐다.
 */
export async function analyzeImages(
  images: { id: string; dataUrl: string }[],
  options: { lookupPrices?: boolean; market?: Market } = {},
): Promise<AnalyzeImagesResult> {
  const market = options.market ?? DEFAULT_MARKET;
  const priceSearchEnabled = isSerpApiConfigured() && options.lookupPrices !== false;
  const failures: AnalyzeImagesResult["failures"] = [];
  const deadline = Date.now() + PRICE_DEADLINE_MS;

  const perImage = await mapWithLimit(images, GEMINI_CONCURRENCY, async (image) => {
    try {
      const detected = await detectItemsInImage(image.dataUrl, market);
      return detected.map((d) => ({ ...d, sourceImageId: image.id }));
    } catch (error) {
      console.error("[analyze-images] gemini failed", image.id, error);
      failures.push({ imageId: image.id, reason: reasonOf(error) });
      return [];
    }
  });

  // 같은 검색어는 한 번만 조회 (사진 여러 장에 같은 상품이 있을 때)
  const priceCache = new Map<string, Promise<PriceLookup | null>>();
  function priceFor(query: string) {
    const key = query.toLowerCase();
    let hit = priceCache.get(key);
    if (!hit) {
      hit = lookupPrice(query, market, { deadline }).catch((error: unknown) => {
        const code = error instanceof Error ? error.message : String(error);
        // 예산 소진은 정상 경로(추정가로 대체)라 에러 로그를 남기지 않는다
        if (code !== DEADLINE_ERROR) {
          console.error("[analyze-images] price lookup failed", query, error);
        }
        return null;
      });
      priceCache.set(key, hit);
    }
    return hit;
  }

  const items = await mapWithLimit(
    perImage.flat(),
    PRICE_CONCURRENCY,
    async (d): Promise<AnalyzedItem> => {
      if (d.priceOnImage) {
        return { ...d, estimatedPrice: d.priceOnImage, priceSource: "image", priceLink: null };
      }
      // 상품을 종류조차 모르는(low) 항목은 검색 결과가 엉뚱할 가능성이 커 검색을 건너뛴다
      if (priceSearchEnabled && d.confidence !== "low") {
        for (const query of searchQueriesFor(d)) {
          if (Date.now() >= deadline) break;
          const found = await priceFor(query);
          if (found) {
            return { ...d, estimatedPrice: found.price, priceSource: "search", priceLink: found.link };
          }
        }
      }
      if (d.typicalPrice) {
        return {
          ...d,
          estimatedPrice: roundPrice(d.typicalPrice, market.currency),
          priceSource: "estimate",
          priceLink: null,
        };
      }
      return { ...d, estimatedPrice: 0, priceSource: "none", priceLink: null };
    },
  );

  return {
    items,
    priceSearchEnabled,
    failures,
    market: { countryCode: market.countryCode, currency: market.currency },
  };
}
