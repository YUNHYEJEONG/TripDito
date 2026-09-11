import "server-only";
import { GoogleGenAI } from "@google/genai";
import { DEFAULT_MARKET, type Market } from "./market";

/** 여행 도시 인근에서 상품을 살 수 있는 매장 후보 */
export type StoreSuggestion = {
  /** 매장명 (한국 여행자 표기, 예: "에미풀 마사키") */
  name: string;
  /** 위치 요약 (예: "마사키초 · 시내에서 차로 20분") */
  area: string;
  /** 왜 여기인지 한 줄 (예: "GAP 정식 매장 입점") */
  note: string;
  /** 근거 링크 (검색 그라운딩 출처 또는 지도 링크) */
  url: string | null;
};

export type StoreSearchResult = {
  stores: StoreSuggestion[];
  /** gemini: 검색 그라운딩 · maps: SerpAPI 지도 검색 · none: 못 찾음 */
  source: "gemini" | "maps" | "none";
};

const MODEL = process.env.GEMINI_VISION_MODEL?.trim() || "gemini-3.6-flash";
const REQUEST_TIMEOUT_MS = 25_000;
const MAX_STORES = 3;

type Place = { city: string; market: Market };

function buildPrompt(productName: string, { city, market }: Place) {
  return `당신은 ${market.countryName} ${city} 여행 쇼핑 도우미입니다.
여행자가 "${productName}" 을(를) 사려고 합니다. Google 검색으로 확인해서 ${city} 시내와 인근(차로 30분 이내)에서 이 상품을 실제로 살 수 있는 매장을 최대 ${MAX_STORES}곳 찾으세요.

규칙:
- 실제 존재가 확인되는 매장만. 브랜드 정식 매장·입점 쇼핑몰·취급 드럭스토어/마트 순으로 우선.
- 같은 체인이 여러 지점이면 ${city} 중심가에서 가까운 지점 하나만.
- name: 한국 여행자가 부르는 표기 (현지어 표기가 있으면 괄호로 병기. 예: "에미풀 마사키 (エミフルMASAKI)")
- area: 위치 요약 — 동네·역 이름과 시내에서의 이동 시간 (예: "마사키초 · 시내에서 차로 20분")
- note: 왜 여기인지 한 줄 (예: "GAP 정식 매장 입점")
- 못 찾으면 빈 배열.

반드시 아래 JSON 배열만 출력하세요. 설명 문장·마크다운 금지.
[{"name":"","area":"","note":""}]`;
}

/** 모델이 코드펜스나 앞뒤 설명을 붙여도 JSON 배열만 골라낸다 */
function extractJsonArray(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)?.[1] ?? text;
  const start = fenced.indexOf("[");
  const end = fenced.lastIndexOf("]");
  if (start < 0 || end <= start) return [];
  try {
    return JSON.parse(fenced.slice(start, end + 1));
  } catch {
    return [];
  }
}

function mapsLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function normalizeStores(parsed: unknown, urls: string[], city: string): StoreSuggestion[] {
  if (!Array.isArray(parsed)) return [];
  const out: StoreSuggestion[] = [];
  const seen = new Set<string>();
  for (const raw of parsed as Partial<StoreSuggestion>[]) {
    const name = String(raw?.name ?? "").trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push({
      name,
      area: String(raw?.area ?? "").trim(),
      note: String(raw?.note ?? "").trim(),
      // 그라운딩 출처가 없으면 매장명으로 지도 검색 링크를 만든다
      url: urls[out.length] ?? urls[0] ?? mapsLink(`${name} ${city}`),
    });
    if (out.length >= MAX_STORES) break;
  }
  return out;
}

async function searchWithGemini(productName: string, place: Place): Promise<StoreSuggestion[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_NOT_CONFIGURED");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: buildPrompt(productName, place) }] }],
    config: {
      // 검색 그라운딩은 구조화 출력(responseSchema)과 함께 쓸 수 없어 텍스트로 받아 파싱한다
      tools: [{ googleSearch: {} }],
      temperature: 0.1,
      abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  });
  const text = response.text?.trim();
  if (!text) return [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const urls = chunks
    .map((c) => c.web?.uri)
    .filter((u): u is string => typeof u === "string" && u.length > 0);
  return normalizeStores(extractJsonArray(text), urls, place.city);
}

type MapsResult = {
  title?: string;
  address?: string;
  type?: string;
  rating?: number;
  place_id?: string;
  data_id?: string;
};

/** SerpAPI 구글 지도 검색 — 그라운딩이 비었을 때만 쓴다 (무료 쿼터 보호) */
async function searchWithMaps(productName: string, { city, market }: Place): Promise<StoreSuggestion[]> {
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey) return [];
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_maps");
  url.searchParams.set("q", `${productName} ${city}`);
  url.searchParams.set("hl", market.hl);
  url.searchParams.set("api_key", apiKey);
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`SERPAPI_${res.status}`);
  const json = (await res.json()) as { local_results?: MapsResult[] };
  return (json.local_results ?? [])
    .filter((r) => r.title)
    .slice(0, MAX_STORES)
    .map((r) => ({
      name: r.title!,
      area: r.address ?? "",
      note: [r.type, r.rating ? `평점 ${r.rating}` : ""].filter(Boolean).join(" · "),
      url: mapsLink(`${r.title} ${r.address ?? city}`),
    }));
}

/**
 * 여행 도시 인근에서 상품을 살 수 있는 매장을 찾는다.
 * 1) Gemini + Google 검색 그라운딩 (근거 링크 포함) → 2) 비면 SerpAPI 지도 검색.
 */
export async function searchStores(
  productName: string,
  city: string,
  market: Market = DEFAULT_MARKET,
): Promise<StoreSearchResult> {
  const place = { city: city.trim(), market };
  const name = productName.trim();
  if (!name || !place.city) return { stores: [], source: "none" };

  try {
    const stores = await searchWithGemini(name, place);
    if (stores.length) return { stores, source: "gemini" };
  } catch (error) {
    console.error("[store-search] gemini failed", name, error);
  }
  try {
    const stores = await searchWithMaps(name, place);
    if (stores.length) return { stores, source: "maps" };
  } catch (error) {
    console.error("[store-search] maps failed", name, error);
  }
  return { stores: [], source: "none" };
}
