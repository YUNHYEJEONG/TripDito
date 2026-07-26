import type {
  AnalyzableImage,
  ImageAnalysisContext,
  ImageAnalyzer,
  ProposedItem,
} from "./port";
import type { LensShoppingCandidate } from "./google-lens";
import {
  buildVisionPrompt,
  extractJsonObject,
  isVisionResultClear,
  parseDataUrl,
  toProposedItem,
  visionProductSchema,
} from "./vision-shared";
import { z } from "zod";

/** 사용 가능한 모델부터 순서대로 시도 */
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-1.5-flash",
] as const;

export function isGeminiConfigured() {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
}

type GeminiResponse = {
  error?: { message?: string; status?: string };
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

const factCheckSchema = z.object({
  matched: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true"),
  nameKo: z.string().optional().default(""),
  nameLocal: z.string().optional().default(""),
  brand: z.string().optional().default(""),
  reason: z.string().optional().default(""),
});

type FactCheckResult = z.infer<typeof factCheckSchema>;

async function callGeminiOnce(
  model: string,
  apiKey: string,
  mimeType: string,
  base64: string,
  prompt: string,
  authMode: "header" | "query" | "bearer",
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const url =
    authMode === "query"
      ? `${endpoint}?key=${encodeURIComponent(apiKey)}`
      : endpoint;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authMode === "bearer") {
    headers.Authorization = `Bearer ${apiKey}`;
  } else if (authMode === "header") {
    headers["x-goog-api-key"] = apiKey;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  const body = (await res.json()) as GeminiResponse;
  if (!res.ok) {
    throw new Error(
      body.error?.message ?? `GEMINI_HTTP_${res.status} (${model}/${authMode})`,
    );
  }

  const text = body.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("\n")
    .trim();

  if (!text) {
    throw new Error(`GEMINI_EMPTY_RESPONSE (${model})`);
  }
  return text;
}

/**
 * Gemini 호출 + JSON 파싱을 모델/인증 루프 안에서 함께 재시도합니다.
 * (텍스트만 성공하고 스키마 파싱이 실패해도 다음 모델로 넘어감)
 */
async function generateGeminiParsed<T>(
  image: AnalyzableImage,
  prompt: string,
  parse: (text: string) => T,
  options?: { maxAttempts?: number },
): Promise<T> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("MISSING_GEMINI_API_KEY");
  }

  const { mimeType, base64 } = parseDataUrl(image.dataUrl);
  const errors: string[] = [];
  // 최신 Google AI 권장: x-goog-api-key 헤더 우선
  const authModes: Array<"header" | "query" | "bearer"> = apiKey.startsWith(
    "AQ.",
  )
    ? ["header", "bearer", "query"]
    : ["header", "query", "bearer"];
  const maxAttempts = options?.maxAttempts ?? Number.POSITIVE_INFINITY;
  let attempts = 0;

  for (const model of GEMINI_MODELS) {
    for (const authMode of authModes) {
      if (attempts >= maxAttempts) break;
      attempts += 1;
      try {
        const text = await callGeminiOnce(
          model,
          apiKey,
          mimeType,
          base64,
          prompt,
          authMode,
        );
        return parse(text);
      } catch (error) {
        errors.push(
          `${model}/${authMode}: ${error instanceof Error ? error.message : "failed"}`,
        );
      }
    }
    if (attempts >= maxAttempts) break;
  }

  throw new Error(errors[0] ?? "GEMINI_FAILED");
}

function buildFactCheckPrompt(
  context: ImageAnalysisContext,
  draft: Pick<ProposedItem, "name" | "localName">,
) {
  return `
당신은 1차 AI 상품명 예측을 팩트체크하는 AI입니다.
결과는 반드시 "브랜드 + 상품" 형식이어야 합니다. (브랜드가 맨 앞)

여행 맥락:
- 국가: ${context.country}
- 도시: ${context.city}
- 통화: ${context.currency}

1차 추정 결과:
- 한국어 상품명: ${draft.name}
- 현지 상품명: ${draft.localName || "(없음)"}

[브랜드 검증]
1) 사진(원단·손잡이·라벨·패키지)에서 브랜드 문자/로고를 찾으세요. (Wpc. / WPC / Felissimo / YOU+MORE 등)
2) 멜론 크림소다·체리·레몬 슬라이스 컨셉 비닐우산은 Felissimo YOU+MORE 와 Wpc. 가 자주 혼동됩니다.
   - 사진에 Felissimo / YOU+MORE 표기가 없으면 Felissimo를 쓰지 마세요.
   - 손잡이·뼈대·택에 Wpc./WPC 가 보이거나, Felissimo 표기 없이 이 컨셉의 시판 우산으로 보이면 brand는 "Wpc." 로 교정하세요.
3) 잘못된 브랜드를 지운 뒤 브랜드 없는 설명만 남기지 마세요.
   - 나쁜 예: "멜론 크림소다 비닐우산"
   - 좋은 예: "Wpc. 멜론 크림소다 비닐우산"
4) nameKo 형식: "{브랜드} {상품 설명}"  — 브랜드가 맨 앞.
5) matched=true: 브랜드까지 포함한 최종명이 사진과 맞을 때.
6) 가격·매장은 다루지 마세요.

반드시 아래 JSON 객체만 출력하세요. 마크다운/설명 금지.
{
  "matched": true,
  "nameKo": "Wpc. 멜론 크림소다 비닐우산",
  "nameLocal": "현지 상품명(모르면 빈 문자열)",
  "brand": "Wpc.",
  "reason": "브랜드를 어디서 확인/교정했는지 한 줄"
}
`.trim();
}

function applyFactCheck(
  item: ProposedItem,
  check: FactCheckResult,
): ProposedItem {
  const nameKo = check.nameKo.trim();
  const nameLocal = check.nameLocal.trim();
  const brand = check.brand.trim();
  if (!nameKo && !brand) return item;

  let nextName = nameKo || item.name;

  if (brand) {
    const brandNorm = brand.replace(/\.$/, "").toLowerCase();
    const nameNorm = nextName.toLowerCase();
    const alreadyHasBrand =
      nameNorm.startsWith(brand.toLowerCase()) ||
      nameNorm.startsWith(`${brandNorm} `) ||
      nameNorm.startsWith("wpc.") ||
      nameNorm.startsWith("wpc ");

    if (!alreadyHasBrand) {
      // 설명만 온 경우 브랜드를 맨 앞에 강제 부착
      nextName = `${brand} ${nextName}`.replace(/\s+/g, " ").trim();
    }
  }

  return {
    ...item,
    name: nextName,
    localName: nameLocal || item.localName,
  };
}

/**
 * 1차 예측 상품명을 이미지와 다시 대조해 브랜드·정식명으로 교정합니다.
 * 실패 시 원본을 그대로 반환합니다. (분석 자체를 막지 않음)
 */
export async function factCheckProposedItemWithGemini(
  image: AnalyzableImage,
  item: ProposedItem,
  context: ImageAnalysisContext,
): Promise<{ item: ProposedItem; factChecked: boolean; reason?: string }> {
  if (!isGeminiConfigured()) {
    return { item, factChecked: false };
  }
  if (!item.name.trim() || item.name === "미확인 상품") {
    return { item, factChecked: false };
  }

  try {
    const parsed = await generateGeminiParsed(
      image,
      buildFactCheckPrompt(context, item),
      (text) => factCheckSchema.parse(extractJsonObject(text)),
      // 팩트체크는 1차 브랜드 억측을 걸러내는 핵심 단계 — 재시도 여유 확보
      { maxAttempts: 4 },
    );
    return {
      item: applyFactCheck(item, parsed),
      factChecked: true,
      reason: parsed.reason.trim() || undefined,
    };
  } catch {
    return { item, factChecked: false };
  }
}

export async function analyzeOneWithGemini(
  image: AnalyzableImage,
  context: ImageAnalysisContext,
  lensCandidates: LensShoppingCandidate[] = [],
): Promise<{ item: ProposedItem; clear: boolean }> {
  const prompt = buildVisionPrompt(context, lensCandidates);
  const parsed = await generateGeminiParsed(
    image,
    prompt,
    (text) => visionProductSchema.parse(extractJsonObject(text)),
  );
  return {
    item: toProposedItem(image, parsed, lensCandidates.length),
    clear: isVisionResultClear(parsed),
  };
}

export const geminiImageAnalyzer: ImageAnalyzer = {
  async analyze(images, context) {
    const items: ProposedItem[] = [];
    for (const image of images) {
      const { item: draft, clear } = await analyzeOneWithGemini(
        image,
        context,
        [],
      );
      if (clear) {
        items.push(draft);
        continue;
      }
      const { item } = await factCheckProposedItemWithGemini(
        image,
        draft,
        context,
      );
      items.push(item);
    }
    return items;
  },
};
