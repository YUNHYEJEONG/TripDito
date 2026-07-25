"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { scrapRepository } from "../data/scrap-repository";

export const scrapKeys = {
  all: ["scraps"] as const,
};

export function useScraps() {
  return useQuery({
    queryKey: scrapKeys.all,
    queryFn: () => scrapRepository.list(),
  });
}

export function useIsScrapped(shotId: string) {
  const { data: scraps = [] } = useScraps();
  return scraps.some((scrap) => scrap.shotId === shotId);
}

export function useToggleScrap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shotId: string) => scrapRepository.toggle(shotId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scrapKeys.all });
    },
  });
}
