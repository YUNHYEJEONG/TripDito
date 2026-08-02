"use client";

import { ChevronRight, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisJob } from "@/features/image-analysis/types/analysis-job";

export function HomeAnalysisBanner({
  job,
  onOpenResult,
  onDismissFailed,
}: {
  job: AnalysisJob;
  onOpenResult: () => void;
  onDismissFailed: () => void;
}) {
  if (job.status === "running") {
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-brand-soft px-3.5 py-2.5">
        <Loader2
          className="size-4 shrink-0 animate-spin text-primary"
          aria-hidden
        />
        <p className="min-w-0 flex-1 truncate text-[13px] font-medium leading-snug text-foreground">
          디토 AI가 분석중입니다.
        </p>
      </div>
    );
  }

  if (job.status === "failed") {
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-brand-soft px-3.5 py-2.5">
        <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-[13px] font-medium leading-snug text-foreground">
          디토 AI 분석에 실패했어요
        </p>
        <button
          type="button"
          aria-label="닫기"
          className="shrink-0 rounded-md p-1 text-primary"
          onClick={onDismissFailed}
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenResult}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl bg-brand-soft px-3.5 py-2.5 text-left",
        "transition-colors active:bg-brand-soft/80",
      )}
    >
      <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
      <p className="min-w-0 flex-1 truncate text-[13px] font-medium leading-snug text-foreground">
        디토 AI 분석 완료! 바로 확인해보세요.
      </p>
      <ChevronRight className="size-5 shrink-0 text-primary" aria-hidden />
    </button>
  );
}
