"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { scrapRepository } from "../data/scrap-repository";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";

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

export function useIsScrapped(shotId: string) {
  const { data: scraps = [] } = useScraps();
  return scraps.some((scrap) => scrap.shotId === shotId);
}

export function useToggleScrap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shotId: string) => scrapRepository.toggle(shotId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scrapKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["shots"] });
    },
  });
}
