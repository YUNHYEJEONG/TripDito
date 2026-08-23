import "server-only";
import { detectItemsInImage, type DetectedItem } from "./gemini";
import { isSerpApiConfigured, lookupPriceJp } from "./serpapi";

export type AnalyzedItem = DetectedItem & {
  sourceImageId: string;
  estimatedPrice: number;
  priceSource: "image" | "search" | "none";
  priceLink: string | null;
};

export type AnalyzeImagesResult = {
  items: AnalyzedItem[];
  priceSearchEnabled: boolean;
};

/**
 * 1단계: Gemini 가 사진에서 품목을 뽑고(OCR 포함),
 * 2단계: 사진에 가격이 없는 품목은 SerpAPI(Google Shopping JP) 로 가격을 찾는다.
 */
export async function analyzeImages(
  images: { id: string; dataUrl: string }[],
  options: { lookupPrices?: boolean } = {},
): Promise<AnalyzeImagesResult> {
  const priceSearchEnabled = isSerpApiConfigured() && options.lookupPrices !== false;

  const perImage = await Promise.all(
    images.map(async (image) => {
      try {
        const detected = await detectItemsInImage(image.dataUrl);
        return detected.map((d) => ({ ...d, sourceImageId: image.id }));
      } catch (error) {
        console.error("[analyze-images] gemini failed", image.id, error);
        return [];
      }
    }),
  );

  const items = await Promise.all(
    perImage.flat().map(async (d): Promise<AnalyzedItem> => {
      if (d.priceOnImage) {
        return { ...d, estimatedPrice: d.priceOnImage, priceSource: "image", priceLink: null };
      }
      if (priceSearchEnabled && d.confidence !== "low" && d.searchQuery) {
        try {
          const found = await lookupPriceJp(d.searchQuery);
          if (found) {
            return { ...d, estimatedPrice: found.price, priceSource: "search", priceLink: found.link };
          }
        } catch (error) {
          console.error("[analyze-images] price lookup failed", d.searchQuery, error);
        }
      }
      return { ...d, estimatedPrice: 0, priceSource: "none", priceLink: null };
    }),
  );

  return { items, priceSearchEnabled };
}
