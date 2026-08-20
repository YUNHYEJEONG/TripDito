import type {
  AnalyzableImage,
  ImageAnalysisContext,
  ProposedItem,
} from "../port";
import type {
  ImageAnalysisMode,
  ImageAnalysisProvider,
} from "../resolve-analyzer";

export type AnalysisJobStatus = "running" | "done" | "failed";

export type AnalysisJobIntent =
  | { kind: "shopping-list"; plannedPurchaseDate?: string | null }
  | { kind: "pretrip-candidates" }
  | {
      kind: "trip-purchases";
      purchasedOn: string;
      context?: "live" | "settlement";
    };

export type AnalysisJob = {
  id: string;
  status: AnalysisJobStatus;
  tripId: string;
  images: AnalyzableImage[];
  context: ImageAnalysisContext;
  /** 완료 뒤에도 구매 상태와 구매일을 잃지 않도록 시작 맥락을 보존한다. */
  intent?: AnalysisJobIntent;
  proposed: ProposedItem[];
  provider?: ImageAnalysisProvider;
  mode?: ImageAnalysisMode;
  warnings?: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
};
