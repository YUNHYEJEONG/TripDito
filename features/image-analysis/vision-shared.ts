import { z } from "zod";
import type { ImageAnalysisContext, ProposedItem } from "./port";
import type { LensShoppingCandidate } from "./google-lens";
import { formatLensCandidatesForPrompt } from "./google-lens";

export const visionProductSchema = z.object({
  nameKo: z.string().min(1),
  nameLocal: z.string().default(""),
  estimatedPrice: z.number().min(0),
  expectedStores: z.array(z.string()).max(3).default([]),
  similarMatchCount: z.number().int().min(1).max(10).default(5),
  /** 이미지에서 읽은 주요 텍스트 (디버그/메모용, UI 비표시) */
  ocrSnippet: z.string().default(""),
  /** 근거: ocr | lens | visual | mixed */
  evidence: z.enum(["ocr", "lens", "visual", "mixed"]).default("mixed"),
});

export type VisionProductResult = z.infer<typeof visionProductSchema>;

export function buildVisionPrompt(
  context: ImageAnalysisContext,
  lensCandidates: LensShoppingCandidate[] = [],
) {
  const lensBlock = formatLensCandidatesForPrompt(lensCandidates);
  const isKorea =
    /한국|korea|대한민국/i.test(context.country) ||
    context.currency.toUpperCase() === "KRW";
  const storeExamples = isKorea
    ? "올리브영, 다이소, 롯데백화점, 이마트"
    : "돈키호테, 마츠모토키요시, 현지 드러그스토어";
  const localNameHint = isKorea
    ? "한국어 상품명과 같거나 영문 브랜드명"
    : "현지 언어 상품명(일본이면 일본어 등)";

  return `
당신은 여행 쇼핑 리스트용 상품 인식 AI입니다.
입력은 (1) 사용자가 올린 사진/캡처 이미지, (2) Google Lens 쇼핑 검색 후보입니다.

여행 맥락:
- 국가: ${context.country}
- 도시: ${context.city}
- 통화: ${context.currency}

[우선순위 — 반드시 이 순서로]
1) OCR / 화면 텍스트 (최우선)
   - 캡처·스크린샷·상세페이지·영수증·가격표에 보이는 상품명·가격·브랜드·용량을 그대로 읽으세요.
   - 이미지에 가격이 보이면 estimatedPrice에 그 숫자를 쓰고, 통화가 다르면 ${context.currency}로 합리적으로 환산하세요.
   - 현지어 상품명이 보이면 nameLocal에 그대로, 한국어로 자연스럽게 nameKo를 적으세요.
2) Google Lens 쇼핑 후보
   - 아래 후보와 OCR 결과가 일치하면 그 후보를 채택하세요.
   - OCR이 빈약할 때만 Lens 후보로 상품을 확정하세요.
3) 시각적 추론
   - 텍스트·Lens가 모두 약할 때만 포장/형태를 보고 유사 실상품을 추정하세요.

Google Lens 쇼핑 후보:
${lensBlock}

반드시 아래 JSON 객체만 출력하세요. 마크다운/설명 금지.
{
  "nameKo": "한국어 상품명",
  "nameLocal": "${localNameHint}. 모르면 빈 문자열",
  "estimatedPrice": 1개당 예상 가격(숫자, ${context.currency} 기준),
  "expectedStores": ["예상구매처1", "예상구매처2", "예상구매처3"],
  "similarMatchCount": 5,
  "ocrSnippet": "이미지에서 읽은 핵심 텍스트 요약(짧게)",
  "evidence": "ocr"
}

규칙:
- nameKo는 "{브랜드} {상품명}" 형식, 브랜드가 맨 앞. (예: "Wpc. 멜론 크림소다 비닐우산")
- 멜론소다 컨셉 우산은 Felissimo와 Wpc. 혼동에 주의. 로고 근거 없는 Felissimo/YOU+MORE 확정 금지.
- expectedStores는 최대 3개. OCR/Lens에 매장명이 있으면 우선 사용. 없으면 ${context.city}/${context.country}에서 팔 법한 매장(예: ${storeExamples}).
- similarMatchCount는 Lens 후보 수와 시각 비교를 반영해 1~8.
- evidence: OCR이 결정적이면 "ocr", Lens가 결정적이면 "lens", 시각만이면 "visual", 둘 이상 합치면 "mixed".
- 전혀 모르면 nameKo를 "미확인 상품"으로.
`.trim();
}

export function parseDataUrl(dataUrl: string): {
  mimeType: string;
  base64: string;
} {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("INVALID_DATA_URL");
  }
  return { mimeType: match[1] ?? "image/jpeg", base64: match[2] ?? "" };
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() ?? trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("NO_JSON_OBJECT");
  }
  return JSON.parse(raw.slice(start, end + 1)) as unknown;
}

export function toProposedItem(
  source: {
    id: string;
    dataUrl: string;
  },
  result: VisionProductResult,
  lensCount = 0,
): ProposedItem {
  return {
    name: result.nameKo.trim(),
    localName: result.nameLocal.trim(),
    estimatedPrice: result.estimatedPrice,
    quantity: 1,
    expectedStores: result.expectedStores
      .map((store) => store.trim())
      .filter(Boolean)
      .slice(0, 3),
    similarMatchCount:
      result.similarMatchCount || Math.max(lensCount, 1) || 5,
    memo: "",
    sourceImageId: source.id,
    imageDataUrl: source.dataUrl,
  };
}

/**
 * 1차 비전 결과가 충분히 명확하면 2차 팩트체크(토큰)를 생략합니다.
 * - OCR/Lens 근거로 상품명이 확정된 경우 → clear
 * - 시각 추측만(visual)이거나 미확인 → ambiguous
 */
export function isVisionResultClear(result: VisionProductResult): boolean {
  const name = result.nameKo.trim();
  if (!name || name === "미확인 상품") return false;

  if (result.evidence === "ocr" || result.evidence === "lens") {
    return true;
  }

  if (result.evidence === "mixed") {
    const ocr = result.ocrSnippet.trim();
    return ocr.length >= 4 && name.length >= 4;
  }

  return false;
}
