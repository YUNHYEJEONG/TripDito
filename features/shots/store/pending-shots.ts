"use client";

import { useSyncExternalStore } from "react";
import type { Shot } from "../schema";

/**
 * 업로드 진행 중인 게시글(낙관적 카드).
 * React Query 캐시에 넣으면 목록이 아직 없을 때 빈 캐시가 "최신"으로 잡혀 실제 조회를 막으므로
 * 별도 스토어에 두고 피드 화면이 맨 위에 합쳐 보여준다.
 */
let pending: Shot[] = [];
const listeners = new Set<() => void>();
const EMPTY: Shot[] = [];

function emit() {
  for (const listener of listeners) listener();
}

export const pendingShots = {
  add(shot: Shot) {
    pending = [shot, ...pending.filter((s) => s.id !== shot.id)];
    emit();
  },
  remove(id: string) {
    const next = pending.filter((s) => s.id !== id);
    if (next.length === pending.length) return;
    pending = next;
    emit();
  },
  newId() {
    return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  },
};

export function usePendingShots() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => pending,
    () => EMPTY,
  );
}
