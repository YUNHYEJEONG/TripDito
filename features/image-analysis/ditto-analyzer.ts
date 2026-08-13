import type {
  AnalyzableImage,
  ImageAnalysisContext,
  ImageAnalyzer,
  ProposedItem,
} from "./port";
import {
  consensusFromCandidates,
  fingerprintFromDataUrl,
  pickSimilarCandidates,
} from "./similar-catalog";

/**
 * 디토 AI 이미지 분석기
 * - 이미지마다 유사 실상품 후보 5개를 비교·합의
 * - 국문 상품명 / 현지 상품명 / 예상 구매처 / 통화 환산 가격 반환
 * - 추후 Google Lens·SerpAPI 등으로 후보 수집부만 교체 가능
 */
export const dittoImageAnalyzer: ImageAnalyzer = {
  async analyze(
    images: AnalyzableImage[],
    context: ImageAnalysisContext,
  ): Promise<ProposedItem[]> {
    // 시각적 검색·비교를 가정한 분석 지연
    await new Promise((resolve) => setTimeout(resolve, 900));

    return images.map((image) => {
      const fingerprint = fingerprintFromDataUrl(image.dataUrl);
      const candidates = pickSimilarCandidates(
        fingerprint,
        context.city,
        context.country,
        5,
      );
      const consensus = consensusFromCandidates(
        candidates,
        context.currency,
        context.city,
      );

      return {
        name: consensus.nameKo,
        localName: consensus.nameLocal,
        estimatedPrice: consensus.estimatedPrice,
        quantity: 1,
        expectedStores: consensus.expectedStores,
        similarMatchCount: candidates.length,
        memo: "",
        sourceImageId: image.id,
        imageDataUrl: image.dataUrl,
      };
    });
  },
};
