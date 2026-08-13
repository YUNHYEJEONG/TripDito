import { dittoImageAnalyzer } from "./ditto-analyzer";
import { imageDraftBuilder } from "./mock-analyzer";
import {
  analyzeOneWithGemini,
  factCheckProposedItemWithGemini,
  isGeminiConfigured,
} from "./gemini-analyzer";
import {
  isGoogleLensConfigured,
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
  | "catalog-demo"
  | "filename-draft"
  | "mixed";

export type ImageAnalysisMode =
  | "ai"
  | "lens"
  | "catalog-demo"
  | "draft"
  | "mixed";

function providerMode(provider: ImageAnalysisProvider): Exclude<ImageAnalysisMode, "mixed"> {
  if (provider === "filename-draft") return "draft";
  if (provider === "catalog-demo") return "catalog-demo";
  if (provider === "lens") return "lens";
  return "ai";
}

export type ImageAnalysisResult = {
  provider: ImageAnalysisProvider;
  mode: ImageAnalysisMode;
  items: ProposedItem[];
  warnings?: string[];
};

async function fetchLensSafe(
  image: AnalyzableImage,
  context: ImageAnalysisContext,
): Promise<{ candidates: LensShoppingCandidate[]; warning?: string }> {
  if (!isSerpApiConfigured()) {
    return { candidates: [] };
  }
  if (!isGoogleLensConfigured()) {
    return {
      candidates: [],
      warning: "lens: PUBLIC_IMAGE_HOST_NOT_ENABLED",
    };
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

  // 연결된 Vision이 모두 실패했을 때도 가짜 분석 결과로 숨기지 않는다.
  // 호출자는 filename-draft 모드를 분명히 표시한다.
  if (isGeminiConfigured() || isOpenAIConfigured()) {
    const [draft] = await imageDraftBuilder.analyze([image], context);
    return {
      item: draft!,
      provider: "filename-draft",
      warning:
        visionErrors[0] ??
        "VISION_FAILED: 연결된 이미지 분석 서비스를 확인해 주세요.",
    };
  }

  // Vision 키가 없을 때만 Lens → 카탈로그 폴백
  if (lens.candidates[0]) {
    const top = lens.candidates[0];
    const candidateCurrency = top.priceCurrency?.trim().toUpperCase();
    const contextCurrency = context.currency.trim().toUpperCase();
    const priceMatchesTripCurrency =
      top.priceValue != null && candidateCurrency === contextCurrency;
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
        estimatedPrice: priceMatchesTripCurrency ? top.priceValue! : 0,
        quantity: 1,
        expectedStores: stores,
        similarMatchCount: lens.candidates.length,
        memo:
          top.priceValue != null && !priceMatchesTripCurrency
            ? `검색 가격 통화(${candidateCurrency || "미상"})가 여행 통화(${contextCurrency})와 달라 가격 확인 필요`
            : "",
        sourceImageId: image.id,
        imageDataUrl: image.dataUrl,
      },
      provider: "lens",
      warning: lens.warning,
    };
  }

  // 카탈로그는 실제 이미지 인식이 아닌 데모 추정이므로 명시적으로 켠
  // preview 환경에서만 사용한다. 일반 환경은 정직한 파일명 초안으로 간다.
  if (process.env.IMAGE_ANALYSIS_CATALOG_FALLBACK === "true") {
    const [catalogItem] = await dittoImageAnalyzer.analyze([image], context);
    return {
      item: catalogItem!,
      provider: "catalog-demo",
      warning: lens.warning,
    };
  }

  const [draft] = await imageDraftBuilder.analyze([image], context);
  return {
    item: draft!,
    provider: "filename-draft",
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
): Promise<ImageAnalysisResult> {
  const items: ProposedItem[] = [];
  const warnings: string[] = [];
  const providers: ImageAnalysisProvider[] = [];

  for (const image of images) {
    const result = await analyzeOneHybrid(image, context);
    items.push(result.item);
    providers.push(result.provider);
    if (result.warning) warnings.push(result.warning);
  }

  const distinctProviders = [...new Set(providers)];
  const provider: ImageAnalysisProvider =
    distinctProviders.length === 1
      ? distinctProviders[0]!
      : "mixed";
  const modes = providers.map(providerMode);
  const distinctModes = [...new Set(modes)];
  return {
    provider,
    mode:
      distinctModes.length > 1
        ? "mixed"
        : distinctModes[0] ?? "draft",
    items,
    warnings: warnings.length ? warnings : undefined,
  };
}
