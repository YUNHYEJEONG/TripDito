import type { AnalyzableImage, ImageAnalyzer, ProposedItem } from "./port";

const MOCK_CATALOG = [
  { name: "돈키호테 스낵 세트", price: 1280 },
  { name: "약국 비타민", price: 980 },
  { name: "캐릭터 파우치", price: 1500 },
  { name: "핸드크림", price: 890 },
  { name: "여행용 어댑터", price: 2200 },
  { name: "로컬 초콜릿", price: 650 },
  { name: "립밤", price: 420 },
  { name: "키링", price: 780 },
];

function pickCatalog(index: number) {
  return MOCK_CATALOG[index % MOCK_CATALOG.length];
}

export const mockImageAnalyzer: ImageAnalyzer = {
  async analyze(images: AnalyzableImage[]): Promise<ProposedItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return images.map((image, index) => {
      const catalog = pickCatalog(index);
      const fromName = image.fileName?.replace(/\.[^.]+$/, "").trim();
      return {
        name: fromName && fromName.length > 1 ? fromName : catalog.name,
        estimatedPrice: catalog.price,
        quantity: 1,
        memo: "데모 분석 결과",
        sourceImageId: image.id,
        imageDataUrl: image.dataUrl,
      };
    });
  },
};
