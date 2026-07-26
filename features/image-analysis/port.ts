export type AnalyzableImage = {
  id: string;
  dataUrl: string;
  fileName?: string;
};

export type ImageAnalysisContext = {
  city: string;
  country: string;
  currency: string;
};

export type ProposedItem = {
  /** 화면 표시용 국문 상품명 */
  name: string;
  /** 화면 비표시 — 현지 언어 상품명 */
  localName: string;
  /** 1개당 예측 가격 (여행지 통화) */
  estimatedPrice: number;
  quantity: number;
  /** 예상 구매처 (AI 제안은 최대 3곳, 사용자 입력 제한 없음) */
  expectedStores: string[];
  /** 비교에 사용한 유사 상품 수 (디버그/설명용) */
  similarMatchCount: number;
  memo: string;
  sourceImageId: string;
  imageDataUrl: string | null;
};

export interface ImageAnalyzer {
  analyze(
    images: AnalyzableImage[],
    context: ImageAnalysisContext,
  ): Promise<ProposedItem[]>;
}
