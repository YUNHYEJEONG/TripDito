import "server-only";
import { detectItemsInImage, type DetectedItem } from "./gemini";
import { isSerpApiConfigured, lookupPrice, type PriceLookup } from "./serpapi";
import { DEFAULT_MARKET, type Market } from "./market";

export type AnalyzedItem = DetectedItem & {
  sourceImageId: string;
  estimatedPrice: number;
  priceSource: "image" | "search" | "none";
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

/**
 * 1단계: Gemini 가 사진에서 품목을 뽑고(OCR 포함),
 * 2단계: 사진에 가격이 없는 품목은 SerpAPI(Google Shopping) 로 가격을 찾는다.
 * 여행지(market)에 따라 프롬프트 언어·통화·검색 지역이 바뀐다.
 */
export async function analyzeImages(
  images: { id: string; dataUrl: string }[],
  options: { lookupPrices?: boolean; market?: Market } = {},
): Promise<AnalyzeImagesResult> {
  const market = options.market ?? DEFAULT_MARKET;
  const priceSearchEnabled = isSerpApiConfigured() && options.lookupPrices !== false;
  const failures: AnalyzeImagesResult["failures"] = [];

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
    let hit = priceCache.get(query);
    if (!hit) {
      hit = lookupPrice(query, market).catch((error: unknown) => {
        console.error("[analyze-images] price lookup failed", query, error);
        return null;
      });
      priceCache.set(query, hit);
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
      if (priceSearchEnabled && d.confidence !== "low" && d.searchQuery) {
        const found = await priceFor(d.searchQuery);
        if (found) {
          return { ...d, estimatedPrice: found.price, priceSource: "search", priceLink: found.link };
        }
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
