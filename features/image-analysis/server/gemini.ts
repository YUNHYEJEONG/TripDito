import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { DEFAULT_MARKET, type Market } from "./market";

/** Gemini 가 사진 1장에서 뽑아낸 품목 */
export type DetectedItem = {
  name: string;
  nameOriginal: string;
  brand: string;
  quantity: number;
  priceOnImage: number | null;
  searchQuery: string;
  confidence: "high" | "medium" | "low";
};

const MODEL = process.env.GEMINI_VISION_MODEL?.trim() || "gemini-3.6-flash";
/** 모델 호출 1회 제한 시간. Vercel 함수 상한(60s) 안에서 재시도 여유를 둔다 */
const REQUEST_TIMEOUT_MS = 40_000;
const MAX_ATTEMPTS = 3;

/**
 * thinking 예산. Flash 계열은 기본으로 thinking 이 켜져 느리고 토큰을 더 쓴다.
 * 구조화 추출에는 불필요하므로 GEMINI_THINKING_BUDGET=0 으로 끌 수 있다 (미설정 시 모델 기본값).
 */
function thinkingConfig() {
  const raw = process.env.GEMINI_THINKING_BUDGET?.trim();
  if (raw === undefined || raw === "") return undefined;
  const budget = Number(raw);
  return Number.isFinite(budget) ? { thinkingBudget: budget } : undefined;
}

function buildPrompt(market: Market) {
  return `당신은 ${market.countryName} 여행 쇼핑 도우미입니다. 사진을 보고 구매할 만한 "상품"을 찾아 JSON 배열로 정리하세요.

규칙:
- 영수증이면 줄마다 한 품목, 상품 사진이면 보이는 상품마다 한 품목. 상품이 없으면 빈 배열.
- 같은 상품이 여러 번 보이면 한 품목으로 합치고 quantity 를 늘릴 것.
- name: 한국 사용자가 알아보기 쉬운 한국어 이름 (브랜드 + 제품명 + 용량). 예: "로이스 생초콜릿 오레 20개입"
- nameOriginal: 사진에 적힌 원문 상품명(현지어/영어) 그대로. 읽을 수 없으면 빈 문자열.
- brand: 브랜드명. 모르면 빈 문자열.
- quantity: 개수. 기본 1.
- priceOnImage: 사진에 가격이 찍혀 있으면 "1개당" 금액(${market.currency}, 정수). 영수증에서 수량×단가로 합계가 적힌 줄은 단가로 환산할 것. 세금 포함 금액이 있으면 그것을 사용. 없으면 null. 절대 추측하지 말 것.
- searchQuery: ${market.countryName} 쇼핑 검색에 쓸 검색어. 브랜드·제품명·용량을 ${market.language}로 (예: 일본이면 "ロイズ 生チョコレート オーレ 20粒").
- confidence: 상품을 정확히 식별했으면 high, 종류만 알면 medium, 불확실하면 low.`;
}

const schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      nameOriginal: { type: Type.STRING },
      brand: { type: Type.STRING },
      quantity: { type: Type.INTEGER },
      priceOnImage: { type: Type.INTEGER, nullable: true },
      searchQuery: { type: Type.STRING },
      confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
    },
    required: [
      "name",
      "nameOriginal",
      "brand",
      "quantity",
      "priceOnImage",
      "searchQuery",
      "confidence",
    ],
  },
};

export function isGeminiConfigured() {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
}

function splitDataUrl(dataUrl: string) {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error("INVALID_DATA_URL");
  return { mimeType: match[1], data: match[2] };
}

/** 429(쿼터)·503(과부하)·타임아웃은 짧게 기다렸다 다시 시도한다 */
function isRetryable(error: unknown) {
  const status = (error as { status?: number })?.status;
  if (status === 429 || status === 503) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /429|503|RESOURCE_EXHAUSTED|UNAVAILABLE|overloaded|abort/i.test(message);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(parsed: unknown): DetectedItem[] {
  if (!Array.isArray(parsed)) return [];
  return (parsed as Partial<DetectedItem>[]).map((item) => ({
    name: item.name?.trim() || item.nameOriginal?.trim() || "알 수 없는 상품",
    nameOriginal: item.nameOriginal ?? "",
    brand: item.brand ?? "",
    quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
    priceOnImage:
      typeof item.priceOnImage === "number" && item.priceOnImage > 0
        ? Math.round(item.priceOnImage)
        : null,
    searchQuery: item.searchQuery?.trim() || item.nameOriginal?.trim() || "",
    confidence: item.confidence ?? "low",
  }));
}

export async function detectItemsInImage(
  dataUrl: string,
  market: Market = DEFAULT_MARKET,
): Promise<DetectedItem[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_NOT_CONFIGURED");
  const ai = new GoogleGenAI({ apiKey });
  const { mimeType, data } = splitDataUrl(dataUrl);

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [
          {
            role: "user",
            parts: [{ inlineData: { mimeType, data } }, { text: buildPrompt(market) }],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.2,
          thinkingConfig: thinkingConfig(),
          abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      });

      // 안전 필터 등으로 본문이 비면 text 가 undefined 다. 빈 결과로 처리하되 원인은 남긴다.
      const text = response.text?.trim();
      if (!text) {
        const reason =
          response.promptFeedback?.blockReason ?? response.candidates?.[0]?.finishReason;
        if (reason) throw new Error(`GEMINI_EMPTY_${reason}`);
        return [];
      }
      return normalize(JSON.parse(text));
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS || !isRetryable(error)) throw error;
      await sleep(1_500 * attempt);
    }
  }
  throw lastError;
}
