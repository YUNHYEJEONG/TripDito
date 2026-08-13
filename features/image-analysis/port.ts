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
  /** 화면 표시용 상품명 */
  name: string;
  /** AI가 찾은 현지 언어 상품명. 파일명 초안이면 빈 문자열 */
  localName: string;
  estimatedPrice: number;
  quantity: number;
  /** AI/Lens가 제안한 구매처. 사용자가 검토 화면에서 수정할 수 있다. */
  expectedStores: string[];
  /** 분석 근거로 비교한 후보 수. 파일명 초안이면 0 */
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
