import { hostImageForLens } from "./temp-image-host";
import type { ImageAnalysisContext } from "./port";

export type LensShoppingCandidate = {
  title: string;
  source: string;
  link: string;
  priceValue: number | null;
  priceCurrency: string | null;
  priceText: string | null;
};

export function isSerpApiConfigured() {
  return Boolean(process.env.SERPAPI_API_KEY?.trim());
}

/**
 * Lens는 data URL을 직접 받지 않아 이미지를 외부 호스트에 잠시 올려야 한다.
 * 사용자의 사진을 알리지 않고 공개 호스트로 보내지 않도록 명시적 설정을 요구한다.
 */
export function isGoogleLensConfigured() {
  return (
    isSerpApiConfigured() &&
    (Boolean(process.env.IMGBB_API_KEY?.trim()) ||
      process.env.IMAGE_ANALYSIS_ENABLE_PUBLIC_IMAGE_HOST === "true")
  );
}

function countryToLensCode(country: string, currency: string): string {
  const c = country.trim().toLowerCase();
  if (c.includes("일본") || c.includes("japan")) return "jp";
  if (c.includes("한국") || c.includes("korea") || c.includes("대한민국")) return "kr";
  if (c.includes("미국") || c.includes("united states") || c.includes("usa")) return "us";
  if (c.includes("태국") || c.includes("thailand")) return "th";
  if (c.includes("베트남") || c.includes("vietnam")) return "vn";
  if (c.includes("대만") || c.includes("taiwan")) return "tw";
  if (c.includes("홍콩") || c.includes("hong kong")) return "hk";
  if (c.includes("싱가포르") || c.includes("singapore")) return "sg";
  if (c.includes("중국") || c.includes("china")) return "cn";
  if (c.includes("프랑스") || c.includes("france")) return "fr";
  if (c.includes("영국") || c.includes("united kingdom") || c.includes("uk")) return "uk";

  const byCurrency: Record<string, string> = {
    JPY: "jp",
    KRW: "kr",
    USD: "us",
    THB: "th",
    VND: "vn",
    TWD: "tw",
    HKD: "hk",
    SGD: "sg",
    CNY: "cn",
    EUR: "fr",
    GBP: "uk",
  };
  return byCurrency[currency.toUpperCase()] ?? "jp";
}

function hlForCountry(code: string): string {
  if (code === "jp") return "ja";
  if (code === "kr") return "ko";
  if (code === "cn" || code === "tw" || code === "hk") return "zh-CN";
  if (code === "th") return "th";
  if (code === "vn") return "vi";
  if (code === "fr") return "fr";
  return "en";
}

type SerpLensMatch = {
  title?: string;
  source?: string;
  link?: string;
  price?: {
    value?: string;
    extracted_value?: number;
    currency?: string;
  };
};

/**
 * Google Lens 쇼핑(products) 검색.
 * SerpAPI 키가 없으면 빈 배열을 반환합니다.
 */
export async function searchGoogleLensShopping(
  dataUrl: string,
  context: ImageAnalysisContext,
): Promise<LensShoppingCandidate[]> {
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey) return [];

  const imageUrl = await hostImageForLens(dataUrl);
  const country = countryToLensCode(context.country, context.currency);
  const hl = hlForCountry(country);

  const params = new URLSearchParams({
    engine: "google_lens",
    type: "products",
    url: imageUrl,
    api_key: apiKey,
    country,
    hl,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const body = (await res.json()) as {
    error?: string;
    visual_matches?: SerpLensMatch[];
  };

  if (!res.ok) {
    throw new Error(body.error ?? `SERPAPI_HTTP_${res.status}`);
  }
  if (body.error) {
    throw new Error(body.error);
  }

  const matches = body.visual_matches ?? [];
  return matches
    .map((match): LensShoppingCandidate | null => {
      const title = match.title?.trim();
      if (!title) return null;
      return {
        title,
        source: match.source?.trim() ?? "",
        link: match.link?.trim() ?? "",
        priceValue:
          typeof match.price?.extracted_value === "number"
            ? match.price.extracted_value
            : null,
        priceCurrency: match.price?.currency?.trim() ?? null,
        priceText: match.price?.value?.trim() ?? null,
      };
    })
    .filter((item): item is LensShoppingCandidate => Boolean(item))
    .slice(0, 8);
}

export function formatLensCandidatesForPrompt(
  candidates: LensShoppingCandidate[],
): string {
  if (!candidates.length) {
    return "(Google Lens 쇼핑 결과 없음 — 이미지 OCR·시각 분석만으로 추론)";
  }

  return candidates
    .map((c, i) => {
      const price =
        c.priceText ??
        (c.priceValue != null
          ? `${c.priceValue}${c.priceCurrency ? ` ${c.priceCurrency}` : ""}`
          : "가격 없음");
      return `${i + 1}. ${c.title} | 판매처: ${c.source || "?"} | 가격: ${price}`;
    })
    .join("\n");
}
