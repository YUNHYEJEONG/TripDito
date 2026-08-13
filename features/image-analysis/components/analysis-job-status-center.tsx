"use client";

import { useState } from "react";
import { ChevronRight, FilePenLine, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { AddFromImagesSheet } from "@/features/image-upload/components/add-from-images-sheet";
import {
  useAnalysisJob,
  useClearAnalysisJob,
  useRetryAnalysisJob,
} from "@/features/image-analysis/hooks/use-analysis-job";
import { cn } from "@/lib/utils";

function getDoneCopy(mode: string | undefined) {
  if (mode === "draft") {
    return {
      label: "파일명 초안 준비 완료",
      Icon: FilePenLine,
    };
  }
  if (mode === "catalog-demo") {
    return {
      label: "데모 상품 추정 준비 완료",
      Icon: FilePenLine,
    };
  }
  if (mode === "mixed") {
    return {
      label: "서로 다른 분석 방식의 결과 준비 완료",
      Icon: Sparkles,
    };
  }
  return { label: "사진 상품 분석 완료", Icon: Sparkles };
}

/**
 * 백그라운드 분석 상태와 검토 진입을 어느 화면에서도 잃지 않게 보여준다.
 * 실제 저장은 기존 AddFromImagesSheet의 검토·수량·합계 UX를 그대로 쓴다.
 */
export function AnalysisJobStatusCenter() {
  const { data: job } = useAnalysisJob();
  const clearJob = useClearAnalysisJob();
  const retryJob = useRetryAnalysisJob();
  const [reviewOpen, setReviewOpen] = useState(false);

  if (!job) return null;

  const doneCopy = getDoneCopy(job.mode);
  const DoneIcon = doneCopy.Icon;

  return (
    <>
      {!reviewOpen ? (
        <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.75rem)] z-40 px-3">
          <div
            className={cn(
              "pointer-events-auto mx-auto flex min-h-12 w-full max-w-[min(var(--app-rail-max),calc(100vw-1.5rem))] items-center gap-2.5 rounded-xl border border-rule bg-paper px-3 shadow-float",
              job.status === "failed" && "border-danger/30",
            )}
            role="status"
            aria-live="polite"
          >
            {job.status === "running" ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin text-accent-text" aria-hidden />
                <p className="min-w-0 flex-1 text-[13px] font-semibold text-foreground">
                  사진 {job.images.length}장을 분석하고 있어요
                </p>
              </>
            ) : job.status === "failed" ? (
              <>
                <p className="min-w-0 flex-1 text-[13px] font-semibold text-foreground">
                  사진 분석을 마치지 못했어요
                </p>
                <button
                  type="button"
                  className="flex size-11 items-center justify-center rounded-lg text-accent-text outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  aria-label="사진 분석 다시 시도"
                  onClick={() => retryJob.mutate()}
                >
                  <RotateCcw className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  className="flex size-11 items-center justify-center rounded-lg text-ink-2 outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  aria-label="실패한 사진 분석 닫기"
                  onClick={() => clearJob.mutate()}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </>
            ) : (
              <button
                type="button"
                className="-mx-1 flex min-h-12 w-[calc(100%+0.5rem)] items-center gap-2.5 rounded-xl px-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-focus"
                onClick={() => setReviewOpen(true)}
              >
                <DoneIcon className="size-4 shrink-0 text-accent-text" aria-hidden />
                <span className="min-w-0 flex-1 text-[13px] font-semibold text-foreground">
                  {doneCopy.label} · 확인하기
                </span>
                <ChevronRight className="size-5 shrink-0 text-accent-text" aria-hidden />
              </button>
            )}
          </div>
        </div>
      ) : null}

      {job.status === "done" ? (
        <AddFromImagesSheet
          key={job.id}
          tripId={job.tripId}
          currency={job.context.currency}
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          reviewProposed={job.proposed}
          fromBackgroundJob
          analysisMode={job.mode}
          intent={job.intent ?? { kind: "shopping-list" }}
        />
      ) : null}
    </>
  );
}
