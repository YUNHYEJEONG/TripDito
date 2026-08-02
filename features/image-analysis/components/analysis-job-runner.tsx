"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/common/toast-alert";
import { analysisJobRepository } from "../data/analysis-job-repository";
import { analysisJobKeys } from "../hooks/use-analysis-job";
import type { ProposedItem } from "../port";

/**
 * running 잡을 전역에서 실행. 시트와 무관하게 fetch 유지.
 */
export function AnalysisJobRunner() {
  const queryClient = useQueryClient();
  const runningRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      const job = analysisJobRepository.get();
      if (!job || job.status !== "running") return;
      if (runningRef.current === job.id) return;
      runningRef.current = job.id;

      try {
        const res = await fetch("/api/image-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: job.images,
            context: job.context,
          }),
        });
        const body = (await res.json()) as {
          items?: ProposedItem[];
          error?: string;
          provider?: string;
          warnings?: string[];
        };
        if (cancelled) return;
        if (!res.ok || !body.items) {
          throw new Error(body.error ?? `HTTP_${res.status}`);
        }
        analysisJobRepository.markDone(body.items);
        toast.success("디토 AI 분석 완료! 바로 확인해보세요.");
        if (body.provider === "catalog") {
          toast.warning(
            body.warnings?.length
              ? "AI 분석에 실패해 데모 결과로 대체했어요. API 키를 확인해주세요."
              : "데모 분석입니다. Gemini API 키를 확인해주세요.",
          );
        } else if (body.warnings?.length) {
          toast.message("일부 보조 검색이 실패했지만 분석은 완료됐어요.");
        }
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error && error.message
            ? error.message
            : "디토 AI 분석에 실패했습니다";
        analysisJobRepository.markFailed(
          message.length > 120
            ? "디토 AI 분석에 실패했습니다. API 키를 확인해주세요."
            : message,
        );
        toast.error(
          message.length > 120
            ? "디토 AI 분석에 실패했습니다. API 키를 확인해주세요."
            : message,
        );
      } finally {
        runningRef.current = null;
        if (!cancelled) {
          void queryClient.invalidateQueries({ queryKey: analysisJobKeys.all });
        }
      }
    }

    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [queryClient]);

  return null;
}
