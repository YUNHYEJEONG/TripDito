import { createId } from "@/lib/storage/id";
import { getJson, removeKey, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import type {
  AnalyzableImage,
  ImageAnalysisContext,
  ProposedItem,
} from "../port";
import type { AnalysisJob, AnalysisJobIntent } from "../types/analysis-job";
import type {
  ImageAnalysisMode,
  ImageAnalysisProvider,
} from "../resolve-analyzer";

function readJob(): AnalysisJob | null {
  const job = getJson<AnalysisJob | null>(storageKeys.analysisJob, null);
  if (!job || !job.id || !job.tripId || !job.status) return null;
  const legacyProvider = job.provider as ImageAnalysisProvider | "catalog" | undefined;
  const provider =
    legacyProvider === "catalog" ? "catalog-demo" : legacyProvider;
  return {
    ...job,
    images: Array.isArray(job.images) ? job.images : [],
    proposed: Array.isArray(job.proposed)
      ? job.proposed.map((item) => ({
          ...item,
          localName: item.localName ?? "",
          expectedStores: Array.isArray(item.expectedStores)
            ? item.expectedStores
            : [],
          similarMatchCount:
            typeof item.similarMatchCount === "number"
              ? item.similarMatchCount
              : 0,
        }))
      : [],
    // 운영판의 완료 job에는 mode가 없으므로 provider로 안전하게 복원한다.
    provider,
    mode:
      job.mode ??
      (legacyProvider === "catalog"
        ? "catalog-demo"
        : provider === "lens"
          ? "lens"
          : provider
            ? "ai"
            : undefined),
  };
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
    intent?: AnalysisJobIntent;
  }): AnalysisJob {
    const now = new Date().toISOString();
    const job: AnalysisJob = {
      id: createId(),
      status: "running",
      tripId: input.tripId,
      images: input.images,
      context: input.context,
      intent: input.intent,
      proposed: [],
      createdAt: now,
      updatedAt: now,
    };
    writeJob(job);
    return job;
  },

  markDone(
    jobId: string,
    proposed: ProposedItem[],
    result: {
      provider: ImageAnalysisProvider;
      mode: ImageAnalysisMode;
      warnings?: string[];
    },
  ): AnalysisJob | null {
    const current = readJob();
    if (!current || current.id !== jobId || current.status !== "running") {
      return current;
    }
    const next: AnalysisJob = {
      ...current,
      status: "done",
      proposed,
      provider: result.provider,
      mode: result.mode,
      warnings: result.warnings,
      error: undefined,
      updatedAt: new Date().toISOString(),
    };
    writeJob(next);
    return next;
  },

  markFailed(jobId: string, error: string): AnalysisJob | null {
    const current = readJob();
    if (!current || current.id !== jobId || current.status !== "running") {
      return current;
    }
    const next: AnalysisJob = {
      ...current,
      status: "failed",
      error,
      updatedAt: new Date().toISOString(),
    };
    writeJob(next);
    return next;
  },

  retry(): AnalysisJob | null {
    const current = readJob();
    if (!current || current.status !== "failed") return current;
    const next: AnalysisJob = {
      ...current,
      status: "running",
      error: undefined,
      updatedAt: new Date().toISOString(),
    };
    writeJob(next);
    return next;
  },

  clear() {
    writeJob(null);
  },

  /**
   * 상품 저장 직전에 완료 job의 이미지 payload를 잠시 비워 localStorage
   * peak 용량을 낮춥니다. 저장 실패 시 `restoreReleased`로 되돌릴 수 있습니다.
   */
  releaseCompleted(jobId: string): AnalysisJob | null {
    const current = readJob();
    if (!current || current.id !== jobId || current.status !== "done") {
      return null;
    }
    writeJob(null);
    return current;
  },

  restoreReleased(job: AnalysisJob) {
    if (!readJob()) writeJob(job);
  },

  /** FAB/중복 분석 차단: running 또는 done(확인 대기) */
  blocksNewUpload(): boolean {
    const job = readJob();
    return job?.status === "running" || job?.status === "done";
  },
};
