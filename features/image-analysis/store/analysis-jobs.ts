"use client";

import { useSyncExternalStore } from "react";
import type { AnalyzableImage, ProposedItem } from "../port";
import { apiImageAnalyzer } from "../api-analyzer";

/**
 * 사진 분석 백그라운드 작업 스토어.
 * 시트가 닫혀도 분석은 계속되고, 끝나면 전역 배너가 결과 보기를 안내한다.
 * 페이지 메모리에만 존재하므로 새로고침하면 사라진다 (배너가 beforeunload 경고를 띄운다).
 */
export type AnalysisJobStatus = "running" | "done" | "failed";

export type AnalysisJob = {
  tripId: string;
  tripName: string;
  status: AnalysisJobStatus;
  images: AnalyzableImage[];
  /** 분석이 끝난 사진 수 (진행률 표시용) */
  completed: number;
  items: ProposedItem[];
  failedImageIds: string[];
  /** 전체 실패 시 오류 코드 */
  errorCode: string | null;
  startedAt: number;
  finishedAt: number | null;
  /** 배너에서 "결과 보기"를 눌러 시트가 열려야 하는 상태 */
  reviewRequested: boolean;
};

type State = { jobs: Record<string, AnalysisJob> };

let state: State = { jobs: {} };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function setJob(tripId: string, patch: Partial<AnalysisJob>) {
  const current = state.jobs[tripId];
  if (!current) return;
  state = { jobs: { ...state.jobs, [tripId]: { ...current, ...patch } } };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

const SERVER_STATE: State = { jobs: {} };
function getServerSnapshot() {
  return SERVER_STATE;
}

export const analysisJobs = {
  get(tripId: string): AnalysisJob | undefined {
    return state.jobs[tripId];
  },

  isRunning(tripId: string) {
    return state.jobs[tripId]?.status === "running";
  },

  hasRunning() {
    return Object.values(state.jobs).some((job) => job.status === "running");
  },

  /** 분석 시작. 같은 여행에 진행 중인 작업이 있으면 무시하고 false 를 돌려준다 */
  start(tripId: string, tripName: string, images: AnalyzableImage[]) {
    if (state.jobs[tripId]?.status === "running") return false;
    const job: AnalysisJob = {
      tripId,
      tripName,
      status: "running",
      images,
      completed: 0,
      items: [],
      failedImageIds: [],
      errorCode: null,
      startedAt: Date.now(),
      finishedAt: null,
      reviewRequested: false,
    };
    state = { jobs: { ...state.jobs, [tripId]: job } };
    emit();

    void apiImageAnalyzer
      .analyze(images, {
        tripId,
        onProgress: (completed) => setJob(tripId, { completed }),
      })
      .then((result) => {
        setJob(tripId, {
          status: "done",
          completed: images.length,
          items: result.items,
          failedImageIds: result.failedImageIds,
          finishedAt: Date.now(),
        });
      })
      .catch((error: unknown) => {
        setJob(tripId, {
          status: "failed",
          errorCode: error instanceof Error ? error.message : "ANALYSIS_FAILED",
          finishedAt: Date.now(),
        });
      });
    return true;
  },

  /** 배너 "결과 보기" → 해당 여행의 시트가 열리도록 표시 */
  requestReview(tripId: string) {
    setJob(tripId, { reviewRequested: true });
  },

  /** 시트가 열린 뒤 플래그 해제 */
  acknowledgeReview(tripId: string) {
    setJob(tripId, { reviewRequested: false });
  },

  /** 검토 중 사용자가 고친 항목을 반영 (시트를 닫았다 열어도 유지) */
  updateItems(tripId: string, items: ProposedItem[]) {
    setJob(tripId, { items });
  },

  /** 저장 완료·취소 시 작업 제거 */
  clear(tripId: string) {
    if (!state.jobs[tripId]) return;
    const jobs = { ...state.jobs };
    delete jobs[tripId];
    state = { jobs };
    emit();
  },
};

export function useAnalysisJobs() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).jobs;
}

export function useAnalysisJob(tripId: string) {
  return useAnalysisJobs()[tripId];
}
