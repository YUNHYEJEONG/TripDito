import { createId } from "@/lib/storage/id";
import { getJson, removeKey, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import type {
  AnalyzableImage,
  ImageAnalysisContext,
  ProposedItem,
} from "../port";
import type { AnalysisJob } from "../types/analysis-job";

function readJob(): AnalysisJob | null {
  return getJson<AnalysisJob | null>(storageKeys.analysisJob, null);
}

function writeJob(job: AnalysisJob | null) {
  if (!job) {
    removeKey(storageKeys.analysisJob);
    return;
  }
  setJson(storageKeys.analysisJob, job);
}

export const analysisJobRepository = {
  get(): AnalysisJob | null {
    return readJob();
  },

  start(input: {
    tripId: string;
    images: AnalyzableImage[];
    context: ImageAnalysisContext;
  }): AnalysisJob {
    const now = new Date().toISOString();
    const job: AnalysisJob = {
      id: createId(),
      status: "running",
      tripId: input.tripId,
      images: input.images,
      context: input.context,
      proposed: [],
      createdAt: now,
      updatedAt: now,
    };
    writeJob(job);
    return job;
  },

  markDone(proposed: ProposedItem[]): AnalysisJob | null {
    const current = readJob();
    if (!current || current.status !== "running") return current;
    const next: AnalysisJob = {
      ...current,
      status: "done",
      proposed,
      error: undefined,
      updatedAt: new Date().toISOString(),
    };
    writeJob(next);
    return next;
  },

  markFailed(error: string): AnalysisJob | null {
    const current = readJob();
    if (!current || current.status !== "running") return current;
    const next: AnalysisJob = {
      ...current,
      status: "failed",
      error,
      updatedAt: new Date().toISOString(),
    };
    writeJob(next);
    return next;
  },

  clear() {
    writeJob(null);
  },

  /** FAB/중복 분석 차단: running 또는 done(확인 대기) */
  blocksNewUpload(): boolean {
    const job = readJob();
    return job?.status === "running" || job?.status === "done";
  },
};
