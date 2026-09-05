import type {
  AnalyzableImage,
  AnalyzeOptions,
  AnalyzeOutcome,
  ImageAnalyzer,
  ProposedItem,
} from "./port";
import type { AnalyzedItem, AnalyzeImagesResult } from "./server/analyze";

/**
 * 서버(Vercel) 요청 본문 상한(4.5MB) 때문에 사진을 1장씩 나눠 보낸다.
 * 서버가 사진마다 모델을 호출하므로 브라우저 쪽 동시 요청도 2개로 제한한다.
 */
const IMAGES_PER_REQUEST = 1;
const CONCURRENT_REQUESTS = 2;

function buildMemo(item: AnalyzedItem) {
  const parts: string[] = [];
  if (item.nameOriginal) parts.push(item.nameOriginal);
  if (item.priceSource === "image") parts.push("가격: 사진에서 읽음");
  else if (item.priceSource === "search") parts.push("가격: 검색 추정");
  return parts.join(" · ");
}

function chunk<T>(list: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

async function requestAnalysis(
  images: AnalyzableImage[],
  options: AnalyzeOptions,
): Promise<AnalyzeImagesResult> {
  const res = await fetch("/api/analyze-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      images: images.map(({ id, dataUrl }) => ({ id, dataUrl })),
      tripId: options.tripId,
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `ANALYZE_${res.status}`);
  }
  return (await res.json()) as AnalyzeImagesResult;
}

/** Gemini(품목 추출) + SerpAPI(가격 검색) 서버 라우트를 호출하는 실제 분석기 */
export const apiImageAnalyzer: ImageAnalyzer = {
  async analyze(images, options = {}): Promise<AnalyzeOutcome> {
    const byId = new Map(images.map((image) => [image.id, image]));
    const batches = chunk(images, IMAGES_PER_REQUEST);
    const results: AnalyzeImagesResult[] = new Array(batches.length);
    const failedImageIds: string[] = [];
    let fatal: Error | null = null;
    let next = 0;
    let completed = 0;

    async function worker() {
      while (next < batches.length && !fatal) {
        const index = next++;
        const batch = batches[index];
        try {
          results[index] = await requestAnalysis(batch, options);
          completed += batch.length;
          options.onProgress?.(completed, images.length);
        } catch (error) {
          const code = error instanceof Error ? error.message : "";
          // 로그인·설정 오류는 전체 실패, 그 외(타임아웃·쿼터)는 해당 사진만 실패 처리
          if (code === "UNAUTHORIZED" || code === "GEMINI_NOT_CONFIGURED" || code === "TRIP_NOT_FOUND") {
            fatal = error instanceof Error ? error : new Error(code);
            return;
          }
          failedImageIds.push(...batch.map((image) => image.id));
          completed += batch.length;
          options.onProgress?.(completed, images.length);
        }
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENT_REQUESTS, batches.length) }, worker),
    );
    if (fatal) throw fatal;

    const items: ProposedItem[] = [];
    for (const result of results) {
      if (!result) continue;
      failedImageIds.push(...result.failures.map((f) => f.imageId));
      for (const item of result.items) {
        items.push({
          name: item.name,
          estimatedPrice: item.estimatedPrice,
          quantity: item.quantity,
          memo: buildMemo(item),
          sourceImageId: item.sourceImageId,
          imageDataUrl: byId.get(item.sourceImageId)?.dataUrl ?? null,
        });
      }
    }
    return { items, failedImageIds: [...new Set(failedImageIds)] };
  },
};
