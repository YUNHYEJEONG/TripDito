import type {
  AnalyzableImage,
  ImageAnalysisContext,
  ImageAnalyzer,
  ProposedItem,
} from "./port";

/**
 * 이미지 인식기가 연결되기 전 사용하는 정직한 로컬 초안 생성기입니다.
 * 픽셀을 분석하거나 가격을 추정하지 않고 파일명만 상품명 초안으로 옮깁니다.
 */
export const imageDraftBuilder = {
  async analyze(
    images: AnalyzableImage[],
    _context?: ImageAnalysisContext,
  ): Promise<ProposedItem[]> {
    void _context;
    return images.map((image, index) => {
      const fromName = image.fileName?.replace(/\.[^.]+$/, "").trim();
      return {
        name: fromName || `상품 ${index + 1}`,
        localName: "",
        estimatedPrice: 0,
        quantity: 1,
        expectedStores: [],
        similarMatchCount: 0,
        memo: "사진 파일명에서 만든 초안",
        sourceImageId: image.id,
        imageDataUrl: image.dataUrl,
      };
    });
  },
} satisfies ImageAnalyzer;

/** @deprecated 새 코드에서는 오해 없는 imageDraftBuilder 이름을 사용하세요. */
export const mockImageAnalyzer = imageDraftBuilder;
