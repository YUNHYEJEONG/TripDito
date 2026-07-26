import type {
  AnalyzableImage,
  ImageAnalysisContext,
  ImageAnalyzer,
  ProposedItem,
} from "./port";
import { dittoImageAnalyzer } from "./ditto-analyzer";

/** @deprecated dittoImageAnalyzer 사용 */
export const mockImageAnalyzer: ImageAnalyzer = {
  analyze(images: AnalyzableImage[], context?: ImageAnalysisContext) {
    return dittoImageAnalyzer.analyze(
      images,
      context ?? { city: "도쿄", country: "일본", currency: "JPY" },
    );
  },
};

export type { ProposedItem };
