"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { analysisJobRepository } from "../data/analysis-job-repository";
import { analysisJobKeys } from "../hooks/use-analysis-job";
import type { ProposedItem } from "../port";
import type {
  ImageAnalysisMode,
  ImageAnalysisProvider,
} from "../resolve-analyzer";
import { notificationRepository } from "@/features/notifications/data/notification-repository";
import { notificationKeys } from "@/features/notifications/hooks/use-notifications";
import { storageKeys } from "@/lib/storage/keys";
import { resolveLocalStorageKey } from "@/lib/storage/local-storage";

/**
 * running 잡을 전역에서 실행. 시트와 무관하게 fetch 유지.
 */
export function AnalysisJobRunner() {
  const queryClient = useQueryClient();
  const runningRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let activeController: AbortController | null = null;

    async function tick() {
      const job = analysisJobRepository.get();
      if (!job || job.status !== "running") return;
      if (runningRef.current === job.id) return;
      const jobStorageKey = resolveLocalStorageKey(storageKeys.analysisJob);
      runningRef.current = job.id;
      const controller = new AbortController();
      activeController = controller;

      try {
        const res = await fetch("/api/image-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            images: job.images,
            context: job.context,
          }),
        });
        const body = (await res.json()) as {
          items?: ProposedItem[];
          error?: string;
          provider?: ImageAnalysisProvider;
          mode?: ImageAnalysisMode;
          warnings?: string[];
        };
        if (cancelled) return;
        if (!res.ok || !body.items || !body.provider || !body.mode) {
          throw new Error(body.error ?? `HTTP_${res.status}`);
        }
        // The request may outlive a logout/account switch. Never write the
        // previous account's result into the newly active account.
        if (resolveLocalStorageKey(storageKeys.analysisJob) !== jobStorageKey) {
          return;
        }
        const completed = analysisJobRepository.markDone(job.id, body.items, {
          provider: body.provider,
          mode: body.mode,
          warnings: body.warnings,
        });
        if (completed?.id !== job.id || completed.status !== "done") return;
        const draftOnly = body.mode === "draft";
        const catalogDemo = body.mode === "catalog-demo";
        const mixed = body.mode === "mixed";
        const title = draftOnly
          ? "파일명 상품 초안이 준비됐어요"
          : catalogDemo
            ? "데모 상품 추정이 준비됐어요"
            : mixed
              ? "서로 다른 분석 방식의 결과가 준비됐어요"
            : "사진 상품 분석이 완료됐어요";
        toast.success(`${title}. 내용을 확인해 주세요.`);
        notificationRepository.create({
          type: "analysis-done",
          title,
          body: draftOnly || catalogDemo
            ? "초안이 포함되어 있으므로 상품명과 가격을 직접 확인해 주세요."
            : mixed
              ? "사진마다 사용 가능한 분석 방식이 달랐어요. 상품명과 가격을 확인해 주세요."
            : "분석 결과를 확인한 뒤 쇼핑리스트에 저장해 주세요.",
          href: `/trips/${job.tripId}`,
          dedupeKey: `analysis-done:${job.id}`,
        });
      } catch (error) {
        if (cancelled) return;
        if (resolveLocalStorageKey(storageKeys.analysisJob) !== jobStorageKey) {
          return;
        }
        const message =
          error instanceof Error && error.message
            ? error.message
            : "디토 AI 분석에 실패했습니다";
        const failed = analysisJobRepository.markFailed(
          job.id,
          message.length > 120
            ? "디토 AI 분석에 실패했습니다. API 키를 확인해주세요."
            : message,
        );
        if (failed?.id !== job.id || failed.status !== "failed") return;
        toast.error(
          message.length > 120
            ? "디토 AI 분석에 실패했습니다. API 키를 확인해주세요."
            : message,
        );
      } finally {
        activeController = null;
        runningRef.current = null;
        if (!cancelled) {
          void queryClient.invalidateQueries({ queryKey: analysisJobKeys.all });
          void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        }
      }
    }

    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, 2000);

    return () => {
      cancelled = true;
      activeController?.abort();
      window.clearInterval(id);
    };
  }, [queryClient]);

  return null;
}
