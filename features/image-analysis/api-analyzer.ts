import type { AnalyzableImage, ImageAnalyzer, ProposedItem } from "./port";
import type {
  AnalyzedItem,
  AnalyzeImagesResult,
} from "./server/analyze";

function buildMemo(item: AnalyzedItem) {
  const parts: string[] = [];
  if (item.nameOriginal) parts.push(item.nameOriginal);
  if (item.priceSource === "image") parts.push("가격: 사진에서 읽음");
  else if (item.priceSource === "search") parts.push("가격: 검색 추정");
  return parts.join(" · ");
}

/** Gemini(품목 추출) + SerpAPI(가격 검색) 서버 라우트를 호출하는 실제 분석기 */
export const apiImageAnalyzer: ImageAnalyzer = {
  async analyze(images: AnalyzableImage[]): Promise<ProposedItem[]> {
    const res = await fetch("/api/analyze-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        images: images.map(({ id, dataUrl }) => ({ id, dataUrl })),
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? `ANALYZE_${res.status}`);
    }
    const data = (await res.json()) as AnalyzeImagesResult;
    const byId = new Map(images.map((image) => [image.id, image]));

    return data.items.map((item) => ({
      name: item.name,
      estimatedPrice: item.estimatedPrice,
      quantity: item.quantity,
      memo: buildMemo(item),
      sourceImageId: item.sourceImageId,
      imageDataUrl: byId.get(item.sourceImageId)?.dataUrl ?? null,
    }));
  },
};
