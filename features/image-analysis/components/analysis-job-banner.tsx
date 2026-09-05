"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { analysisJobs, useAnalysisJobs } from "../store/analysis-jobs";

/**
 * 백그라운드 사진 분석 상태 배너. 모든 화면 하단(바텀 내비 위)에 고정된다.
 * - 진행 중: 진행률 표시, 새로고침·이탈 시 경고
 * - 완료: "결과 보기" → 해당 여행 화면으로 이동해 검토 시트를 연다
 * - 실패: 원인 안내, 닫기
 */
export function AnalysisJobBanner() {
  const jobs = useAnalysisJobs();
  const router = useRouter();
  const pathname = usePathname();
  const list = Object.values(jobs);
  const running = list.filter((job) => job.status === "running");
  const notified = useRef(new Set<string>());

  // 진행 중인 분석이 있으면 새로고침·탭 닫기 전에 경고 (메모리에만 있는 작업이라 사라진다)
  useEffect(() => {
    if (running.length === 0) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      // 최신 브라우저는 커스텀 문구를 무시하고 기본 경고를 띄운다
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running.length]);

  // 완료 알림은 하단 배너 하나로만. 이미 그 여행 화면에 있으면 검토 시트를 바로 연다
  useEffect(() => {
    for (const job of list) {
      if (job.status !== "done" || notified.current.has(`${job.tripId}:${job.finishedAt}`)) continue;
      notified.current.add(`${job.tripId}:${job.finishedAt}`);
      if (pathname === `/trips/${job.tripId}`) analysisJobs.requestReview(job.tripId);
    }
    // list 의 상태 변화만 보면 된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.map((job) => `${job.tripId}:${job.status}`).join(",")]);

  function openReview(tripId: string) {
    analysisJobs.requestReview(tripId);
    if (pathname !== `/trips/${tripId}`) router.push(`/trips/${tripId}`);
  }

  if (list.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-2 px-4 pb-2"
      aria-live="polite"
    >
      {list.map((job) => {
        const total = job.images.length;
        const pct = total ? Math.round((job.completed / total) * 100) : 0;
        return (
          <div
            key={job.tripId}
            className={cn(
              "pointer-events-auto flex w-full max-w-[480px] items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur",
              job.status === "failed"
                ? "border-destructive/30 bg-destructive/10"
                : "border-[#EAEDED] bg-background/95",
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {job.status === "running" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : job.status === "done" ? (
                <Sparkles className="size-4" />
              ) : (
                <AlertCircle className="size-4 text-destructive" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">
                {job.status === "running"
                  ? `${job.tripName} 사진 분석 중… ${job.completed}/${total}`
                  : job.status === "done"
                    ? `${job.tripName} 분석 완료 · 상품 ${job.items.length}개`
                    : `${job.tripName} 분석 실패`}
              </p>
              {job.status === "running" ? (
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#EAEDED]">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              ) : job.status === "done" && job.failedImageIds.length ? (
                <p className="text-[11px] text-muted-foreground">
                  사진 {job.failedImageIds.length}장은 분석하지 못했어요
                </p>
              ) : job.status === "failed" ? (
                <p className="text-[11px] text-muted-foreground">
                  {job.errorCode === "UNAUTHORIZED"
                    ? "로그인이 필요합니다"
                    : job.errorCode === "GEMINI_NOT_CONFIGURED"
                      ? "분석 서비스가 설정되지 않았습니다"
                      : "잠시 후 다시 시도해 주세요"}
                </p>
              ) : null}
            </div>
            {job.status === "done" ? (
              <button
                type="button"
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground"
                onClick={() => openReview(job.tripId)}
              >
                결과 보기
              </button>
            ) : null}
            {job.status !== "running" ? (
              <button
                type="button"
                aria-label="닫기"
                className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-[#F2F4F6]"
                onClick={() => analysisJobs.clear(job.tripId)}
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
