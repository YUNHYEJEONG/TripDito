"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shotRepository, type ShotListFilter } from "../data/shot-repository";
import type { Shot, ShotFormValues } from "../schema";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";

import { scrapKeys } from "./use-scraps";

export const shotKeys = {
  all: ["shots"] as const,
  list: (filter: ShotListFilter = {}) => ["shots", "list", filter] as const,
  detail: (id: string) => ["shots", "detail", id] as const,
  items: (id: string) => ["shots", "items", id] as const,
};

/** 피드 목록 (로그인 필요). 기본 최신순 100건 */
export function useShots(filter: ShotListFilter = {}) {
  const { isLoggedIn } = useIsLoggedIn();
  const merged: ShotListFilter = { limit: 100, ...filter };
  return useQuery({
    queryKey: shotKeys.list(merged),
    queryFn: () => shotRepository.list(merged),
    enabled: isLoggedIn,
  });
}

/** 내가 좋아요한 때샷 */
export function useLikedShots() {
  return useShots({ liked: "me" });
}

export function useShot(id: string) {
  const { isLoggedIn } = useIsLoggedIn();
  return useQuery({
    queryKey: shotKeys.detail(id),
    queryFn: () => shotRepository.getById(id),
    enabled: Boolean(id) && isLoggedIn,
  });
}

/** 때샷에 연결된 쇼핑품목 + 여행 요약 (퍼가기 시트) */
export function useShotItems(shotId: string, enabled = true) {
  const { isLoggedIn } = useIsLoggedIn();
  return useQuery({
    queryKey: shotKeys.items(shotId),
    queryFn: () => shotRepository.listItems(shotId),
    enabled: Boolean(shotId) && enabled && isLoggedIn,
  });
}

function useInvalidateShot() {
  const queryClient = useQueryClient();
  return (shot?: Shot | string) => {
    void queryClient.invalidateQueries({ queryKey: shotKeys.all });
    const id = typeof shot === "string" ? shot : shot?.id;
    if (id) {
      void queryClient.invalidateQueries({ queryKey: shotKeys.detail(id) });
    }
  };
}

export function useCreateShot() {
  const invalidate = useInvalidateShot();
  return useMutation({
    mutationFn: (input: ShotFormValues) => shotRepository.create(input),
    onSuccess: () => invalidate(),
  });
}

export function useToggleShotLike() {
  const invalidate = useInvalidateShot();
  return useMutation({
    mutationFn: (id: string) => shotRepository.toggleLike(id),
    onSuccess: (shot) => invalidate(shot),
  });
}

export function useAddShotComment() {
  const invalidate = useInvalidateShot();
  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      shotRepository.addComment(id, text),
    onSuccess: (shot) => invalidate(shot),
  });
}

export function useRemoveShotComment() {
  const invalidate = useInvalidateShot();
  return useMutation({
    mutationFn: ({
      shotId,
      commentId,
    }: {
      shotId: string;
      commentId: string;
    }) => shotRepository.removeComment(shotId, commentId),
    onSuccess: (shot) => invalidate(shot),
  });
}

export function useIncrementShotShare() {
  const invalidate = useInvalidateShot();
  return useMutation({
    mutationFn: (id: string) => shotRepository.incrementShare(id),
    onSuccess: (shot) => invalidate(shot),
  });
}

export function useUpdateShot(id: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateShot();
  return useMutation({
    mutationFn: (input: ShotFormValues) =>
      shotRepository.update(
        id,
        input,
        queryClient.getQueryData<Shot>(shotKeys.detail(id)),
      ),
    onSuccess: (shot) => invalidate(shot),
  });
}

export function useDeleteShot() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateShot();
  return useMutation({
    mutationFn: async (id: string) => {
      await shotRepository.remove(id);
      return id;
    },
    onSuccess: (id) => {
      invalidate(id);
      void queryClient.invalidateQueries({ queryKey: scrapKeys.all });
    },
  });
}
