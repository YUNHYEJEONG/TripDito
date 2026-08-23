import "server-only";
import { GoogleGenAI, Type } from "@google/genai";

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

const PROMPT = `당신은 일본 여행 쇼핑 도우미입니다. 사진을 보고 구매할 만한 "상품"을 찾아 JSON 배열로 정리하세요.

규칙:
- 영수증이면 줄마다 한 품목, 상품 사진이면 보이는 상품마다 한 품목. 상품이 없으면 빈 배열.
- name: 한국 사용자가 알아보기 쉬운 한국어 이름 (브랜드 + 제품명 + 용량). 예: "로이스 생초콜릿 오레 20개입"
- nameOriginal: 사진에 적힌 원문 상품명(일본어/영어) 그대로. 읽을 수 없으면 빈 문자열.
- brand: 브랜드명. 모르면 빈 문자열.
- quantity: 개수. 기본 1.
- priceOnImage: 사진에 가격이 찍혀 있으면 그 금액(엔, 정수). 없으면 null. 절대 추측하지 말 것.
- searchQuery: 일본 쇼핑 검색에 쓸 검색어. 브랜드·제품명·용량을 일본어로 (예: "ロイズ 生チョコレート オーレ 20粒").
- confidence: 상품을 정확히 식별했으면 high, 종류만 알면 medium, 불확실하면 low.`;

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

export async function detectItemsInImage(dataUrl: string): Promise<DetectedItem[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_NOT_CONFIGURED");
  const ai = new GoogleGenAI({ apiKey });
  const { mimeType, data } = splitDataUrl(dataUrl);

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [{ inlineData: { mimeType, data } }, { text: PROMPT }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.2,
    },
  });

  const parsed = JSON.parse(response.text ?? "[]") as Partial<DetectedItem>[];
  return parsed.map((item) => ({
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
