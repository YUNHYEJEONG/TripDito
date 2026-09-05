"use client";

import type { QueryClient } from "@tanstack/react-query";
import type { Scrap, Shot } from "../schema";

/**
 * 낙관적 업데이트용 캐시 도우미.
 * 게시글은 피드 목록(["shots","list",…]), 상세(["shots","detail",id]), 스크랩 목록(["scraps"]) 세 곳에
 * 흩어져 있으므로 세 곳을 한 번에 고치고, 실패하면 스냅샷으로 되돌린다.
 */
export const SHOTS_KEY = ["shots"] as const;
export const SCRAPS_KEY = ["scraps"] as const;

function isShot(value: unknown): value is Shot {
  return Boolean(
    value && typeof value === "object" && "id" in value && "likeCount" in value && "images" in value,
  );
}

function isScrap(value: unknown): value is Scrap & { shot?: Shot } {
  return Boolean(value && typeof value === "object" && "shotId" in value);
}

type Snapshot = [readonly unknown[], unknown][];

export function snapshotShotCaches(queryClient: QueryClient): Snapshot {
  return [
    ...queryClient.getQueriesData({ queryKey: SHOTS_KEY }),
    ...queryClient.getQueriesData({ queryKey: SCRAPS_KEY }),
  ];
}

export function restoreShotCaches(queryClient: QueryClient, snapshot: Snapshot) {
  for (const [key, data] of snapshot) queryClient.setQueryData(key, data);
}

/** 캐시에 있는 게시글 하나를 찾는다 (목록·상세·스크랩 순) */
export function findShotInCaches(queryClient: QueryClient, shotId: string): Shot | undefined {
  for (const [, data] of queryClient.getQueriesData({ queryKey: SHOTS_KEY })) {
    if (Array.isArray(data)) {
      const hit = data.find((s) => isShot(s) && s.id === shotId);
      if (hit) return hit as Shot;
    } else if (isShot(data) && data.id === shotId) {
      return data;
    }
  }
  for (const [, data] of queryClient.getQueriesData({ queryKey: SCRAPS_KEY })) {
    if (!Array.isArray(data)) continue;
    const hit = data.find((s) => isScrap(s) && s.shotId === shotId) as { shot?: Shot } | undefined;
    if (hit?.shot) return hit.shot;
  }
  return undefined;
}

/** 모든 캐시에서 해당 게시글을 updater 결과로 바꾼다 */
export function updateShotInCaches(
  queryClient: QueryClient,
  shotId: string,
  updater: (shot: Shot) => Shot,
) {
  queryClient.setQueriesData({ queryKey: SHOTS_KEY }, (data: unknown) => {
    if (Array.isArray(data)) {
      let changed = false;
      const next = data.map((s) => {
        if (isShot(s) && s.id === shotId) {
          changed = true;
          return updater(s);
        }
        return s;
      });
      return changed ? next : data;
    }
    if (isShot(data) && data.id === shotId) return updater(data);
    return data;
  });
  queryClient.setQueriesData({ queryKey: SCRAPS_KEY }, (data: unknown) => {
    if (!Array.isArray(data)) return data;
    let changed = false;
    const next = data.map((s) => {
      if (isScrap(s) && s.shotId === shotId && s.shot) {
        changed = true;
        return { ...s, shot: updater(s.shot) };
      }
      return s;
    });
    return changed ? next : data;
  });
}

/** 서버 응답으로 캐시를 덮어쓴다 (재조회 없이 확정) */
export function replaceShotInCaches(queryClient: QueryClient, shot: Shot) {
  updateShotInCaches(queryClient, shot.id, () => shot);
}

/** 목록·스크랩에서 제거하고 상세 캐시는 비운다 */
export function removeShotFromCaches(queryClient: QueryClient, shotId: string) {
  queryClient.setQueriesData({ queryKey: SHOTS_KEY }, (data: unknown) => {
    if (Array.isArray(data)) {
      const next = data.filter((s) => !(isShot(s) && s.id === shotId));
      return next.length === data.length ? data : next;
    }
    return data;
  });
  queryClient.setQueriesData({ queryKey: SCRAPS_KEY }, (data: unknown) => {
    if (!Array.isArray(data)) return data;
    const next = data.filter((s) => !(isScrap(s) && s.shotId === shotId));
    return next.length === data.length ? data : next;
  });
  queryClient.removeQueries({ queryKey: [...SHOTS_KEY, "detail", shotId] });
}

/** 피드 목록(필터 무관) 맨 앞에 게시글을 끼워 넣는다. 이미 있으면 교체 */
export function prependShotToLists(queryClient: QueryClient, shot: Shot) {
  queryClient.setQueriesData({ queryKey: [...SHOTS_KEY, "list"] }, (data: unknown) => {
    if (!Array.isArray(data)) return data;
    const rest = data.filter((s) => !(isShot(s) && s.id === shot.id));
    return [shot, ...rest];
  });
}

/** 활성 목록은 건드리지 않고 다음 마운트 때만 다시 불러오도록 표시 */
export function markShotsStale(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: SHOTS_KEY, refetchType: "none" });
  void queryClient.invalidateQueries({ queryKey: SCRAPS_KEY, refetchType: "none" });
}
