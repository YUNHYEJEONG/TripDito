import { dittoImageAnalyzer } from "./ditto-analyzer";
import {
  analyzeOneWithGemini,
  factCheckProposedItemWithGemini,
  isGeminiConfigured,
} from "./gemini-analyzer";
import {
  isSerpApiConfigured,
  searchGoogleLensShopping,
  type LensShoppingCandidate,
} from "./google-lens";
import { analyzeOneWithOpenAI, isOpenAIConfigured } from "./openai-analyzer";
import type {
  AnalyzableImage,
  ImageAnalysisContext,
  ProposedItem,
} from "./port";

export type ImageAnalysisProvider =
  | "gemini+lens"
  | "openai+lens"
  | "lens"
  | "gemini"
  | "openai"
  | "catalog";

async function fetchLensSafe(
  image: AnalyzableImage,
  context: ImageAnalysisContext,
): Promise<{ candidates: LensShoppingCandidate[]; warning?: string }> {
  if (!isSerpApiConfigured()) {
    return { candidates: [] };
  }
  try {
    const candidates = await searchGoogleLensShopping(image.dataUrl, context);
    return { candidates };
  } catch (error) {
    return {
      candidates: [],
      warning: `lens: ${error instanceof Error ? error.message : "failed"}`,
    };
  }
}

/** Gemini가 있으면 1차 예측이 모호할 때만 상품명 팩트체크 (토큰 절약) */
async function withGeminiFactCheck(
  image: AnalyzableImage,
  item: ProposedItem,
  context: ImageAnalysisContext,
  warning?: string,
  options?: { skip?: boolean },
): Promise<{ item: ProposedItem; warning?: string }> {
  if (options?.skip || !isGeminiConfigured()) {
    return { item, warning };
  }

  const checked = await factCheckProposedItemWithGemini(image, item, context);
  return {
    item: checked.item,
    warning,
  };
}

async function analyzeOneHybrid(
  image: AnalyzableImage,
  context: ImageAnalysisContext,
): Promise<{
  item: ProposedItem;
  provider: ImageAnalysisProvider;
  warning?: string;
}> {
  const lens = await fetchLensSafe(image, context);
  const hasLens = lens.candidates.length > 0;
  const visionErrors: string[] = [];

  if (isGeminiConfigured()) {
    try {
      const { item: draft, clear } = await analyzeOneWithGemini(
        image,
        context,
        lens.candidates,
      );
      const checked = await withGeminiFactCheck(
        image,
        draft,
        context,
        lens.warning,
        { skip: clear },
      );
      return {
        item: checked.item,
        provider: hasLens ? "gemini+lens" : "gemini",
        warning: checked.warning,
      };
    } catch (error) {
      visionErrors.push(
        `gemini: ${error instanceof Error ? error.message : "failed"}`,
      );
    }
  }

  if (isOpenAIConfigured()) {
    try {
      const { item: draft, clear } = await analyzeOneWithOpenAI(
        image,
        context,
        lens.candidates,
      );
      const checked = await withGeminiFactCheck(
        image,
        draft,
        context,
        [lens.warning, ...visionErrors].filter(Boolean).join(" | ") ||
          undefined,
        { skip: clear },
      );
      return {
        item: checked.item,
        provider: hasLens ? "openai+lens" : "openai",
        warning: checked.warning,
      };
    } catch (error) {
      visionErrors.push(
        `openai: ${error instanceof Error ? error.message : "failed"}`,
      );
    }
  }

  // Vision API 키가 있는데 전부 실패하면 데모(킷캣 등)로 숨기지 않고 에러
  if (isGeminiConfigured() || isOpenAIConfigured()) {
    throw new Error(
      visionErrors[0] ??
        "VISION_FAILED: API 키를 확인하세요. Google AI Studio에서 새 키를 발급해 .env.local에 넣고 서버를 재시작해주세요.",
    );
  }

  // Vision 키가 없을 때만 Lens → 카탈로그 폴백
  if (lens.candidates[0]) {
    const top = lens.candidates[0];
    const stores = [
      ...new Set(
        lens.candidates
          .map((c) => c.source)
          .filter(Boolean)
          .slice(0, 3),
      ),
    ];
    return {
      item: {
        name: top.title,
        localName: top.title,
        estimatedPrice: top.priceValue ?? 0,
        quantity: 1,
        expectedStores: stores,
        similarMatchCount: lens.candidates.length,
        memo: "",
        sourceImageId: image.id,
        imageDataUrl: image.dataUrl,
      },
      provider: "lens",
      warning: lens.warning,
    };
  }

  const [catalogItem] = await dittoImageAnalyzer.analyze([image], context);
  return {
    item: catalogItem!,
    provider: "catalog",
    warning: lens.warning,
  };
}

/**
 * 이미지마다:
 * 1) Google Lens 쇼핑 검색 (SerpAPI)
 * 2) Gemini/OpenAI가 OCR 텍스트 + 상품 이미지 + Lens 후보를 합쳐 추론
 * 3) 1차가 모호할 때만 Gemini 상품명 팩트체크 (명확하면 스킵)
 */
export async function analyzeWithFallback(
  images: AnalyzableImage[],
  context: ImageAnalysisContext,
) {
  const items: ProposedItem[] = [];
  const warnings: string[] = [];
  let provider: ImageAnalysisProvider = "catalog";

  for (const image of images) {
    const result = await analyzeOneHybrid(image, context);
    items.push(result.item);
    provider = result.provider;
    if (result.warning) warnings.push(result.warning);
  }

  return {
    provider,
    items,
    warnings: warnings.length ? warnings : undefined,
  };
}
