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

export interface ImageAnalyzer {
  analyze(images: AnalyzableImage[]): Promise<ProposedItem[]>;
}
