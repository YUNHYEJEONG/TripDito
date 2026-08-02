import type {
  AnalyzableImage,
  ImageAnalysisContext,
  ProposedItem,
} from "../port";

export type AnalysisJobStatus = "running" | "done" | "failed";

export type AnalysisJob = {
  id: string;
  status: AnalysisJobStatus;
  tripId: string;
  images: AnalyzableImage[];
  context: ImageAnalysisContext;
  proposed: ProposedItem[];
  error?: string;
  createdAt: string;
  updatedAt: string;
};
