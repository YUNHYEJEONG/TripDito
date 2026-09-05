export type AnalyzableImage = {
  id: string;
  dataUrl: string;
  fileName?: string;
};

export type ProposedItem = {
  name: string;
  estimatedPrice: number;
  quantity: number;
  memo: string;
  sourceImageId: string;
  imageDataUrl: string | null;
};

export type AnalyzeOptions = {
  /** 여행 ID. 여행지 국가·통화에 맞춰 분석한다 */
  tripId?: string;
  /** 사진 한 장의 분석이 끝날 때마다 완료 수를 알려준다 (진행률 표시용) */
  onProgress?: (completed: number, total: number) => void;
};

export type AnalyzeOutcome = {
  items: ProposedItem[];
  /** 분석에 실패한 사진 ID (일부 실패 시 나머지 결과는 items 에 담긴다) */
  failedImageIds: string[];
};

export interface ImageAnalyzer {
  analyze(images: AnalyzableImage[], options?: AnalyzeOptions): Promise<AnalyzeOutcome>;
}
