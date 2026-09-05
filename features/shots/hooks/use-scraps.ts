"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { scrapRepository } from "../data/scrap-repository";
import type { Scrap } from "../schema";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";
import {
  findShotInCaches,
  markShotsStale,
  restoreShotCaches,
  snapshotShotCaches,
  updateShotInCaches,
} from "./shot-cache";

export const scrapKeys = {
  all: ["scraps"] as const,
};

export function useScraps() {
  const { isLoggedIn } = useIsLoggedIn();
  return useQuery({
    queryKey: scrapKeys.all,
    queryFn: () => scrapRepository.list(),
    enabled: isLoggedIn,
  });
}

/** 스크랩 여부: 스크랩 목록이 로드됐으면 그것을, 아니면 게시글의 scrappedByMe 를 본다 */
export function useIsScrapped(shotId: string) {
  const { data: scraps } = useScraps();
  const queryClient = useQueryClient();
  if (scraps) return scraps.some((scrap) => scrap.shotId === shotId);
  return Boolean(findShotInCaches(queryClient, shotId)?.scrappedByMe);
}

export function useToggleScrap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shotId: string) => scrapRepository.toggle(shotId),
    onMutate: async (shotId) => {
      await queryClient.cancelQueries({ queryKey: scrapKeys.all });
      const snapshot = snapshotShotCaches(queryClient);
      const shot = findShotInCaches(queryClient, shotId);
      const wasScrapped =
        queryClient.getQueryData<Scrap[]>(scrapKeys.all)?.some((s) => s.shotId === shotId) ??
        Boolean(shot?.scrappedByMe);

      updateShotInCaches(queryClient, shotId, (s) => ({ ...s, scrappedByMe: !wasScrapped }));
      queryClient.setQueryData<Scrap[]>(scrapKeys.all, (old) => {
        if (!old) return old;
        if (wasScrapped) return old.filter((s) => s.shotId !== shotId);
        if (!shot) return old;
        const now = new Date().toISOString();
        return [{ id: shotId, shotId, createdAt: now, shot: { ...shot, scrappedByMe: true } }, ...old];
      });
      return { snapshot };
    },
    onError: (_error, _shotId, context) => {
      if (context) restoreShotCaches(queryClient, context.snapshot);
    },
    onSuccess: ({ scraped }, shotId) => {
      updateShotInCaches(queryClient, shotId, (s) => ({ ...s, scrappedByMe: scraped }));
    },
    onSettled: () => {
      markShotsStale(queryClient);
      // 스크랩 목록은 순서·시각이 서버 기준이므로 화면에 떠 있으면 조용히 재조회
      void queryClient.invalidateQueries({ queryKey: scrapKeys.all });
    },
  });
}
