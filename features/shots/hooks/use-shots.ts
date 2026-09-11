"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shotRepository, type ShotListFilter } from "../data/shot-repository";
import type { Shot, ShotComment, ShotFormValues } from "../schema";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";
import { useLocalProfile } from "@/features/profile/hooks/use-local-profile";
import { useTrips } from "@/features/trips/hooks/use-trips";
import { pendingShots } from "../store/pending-shots";
import {
  findShotInCaches,
  markShotsStale,
  prependShotToLists,
  removeShotFromCaches,
  replaceShotInCaches,
  restoreShotCaches,
  snapshotShotCaches,
  updateShotInCaches,
} from "./shot-cache";
import { scrapKeys } from "./use-scraps";

/** 캐시 키에 넣는 조회자 구분. 로그인 전후로 likedByMe 등이 달라지므로 분리한다 */
type Viewer = "me" | "guest";

export const shotKeys = {
  all: ["shots"] as const,
  list: (filter: ShotListFilter = {}, viewer: Viewer = "me") =>
    ["shots", "list", filter, viewer] as const,
  detail: (id: string, viewer: Viewer = "me") =>
    ["shots", "detail", id, viewer] as const,
  items: (id: string) => ["shots", "items", id] as const,
};

/** 내 글 / 내가 좋아요한 글 필터는 로그인해야 조회할 수 있다 */
function needsLogin(filter: ShotListFilter) {
  return filter.author === "me" || filter.liked === "me";
}

/**
 * 피드 목록. 기본 최신순 100건.
 * 비로그인도 구경할 수 있다 (좋아요·댓글·스크랩만 로그인 필요).
 */
export function useShots(filter: ShotListFilter = {}) {
  const { isLoggedIn, isLoading } = useIsLoggedIn();
  const merged: ShotListFilter = { limit: 100, ...filter };
  return useQuery({
    queryKey: shotKeys.list(merged, isLoggedIn ? "me" : "guest"),
    queryFn: () => shotRepository.list(merged),
    // 세션 확인 전에 guest 로 불러오면 로그인 직후 한 번 더 받게 되므로 기다린다
    enabled: !isLoading && (isLoggedIn || !needsLogin(merged)),
  });
}

/** 내가 좋아요한 때샷 */
export function useLikedShots() {
  return useShots({ liked: "me" });
}

export function useShot(id: string) {
  const { isLoggedIn, isLoading } = useIsLoggedIn();
  return useQuery({
    queryKey: shotKeys.detail(id, isLoggedIn ? "me" : "guest"),
    queryFn: () => shotRepository.getById(id),
    enabled: Boolean(id) && !isLoading,
  });
}

/** 때샷에 연결된 쇼핑품목 + 여행 요약 (퍼가기 시트). 보는 건 비로그인도 가능 */
export function useShotItems(shotId: string, enabled = true) {
  return useQuery({
    queryKey: shotKeys.items(shotId),
    queryFn: () => shotRepository.listItems(shotId),
    enabled: Boolean(shotId) && enabled,
  });
}

/*
 * 낙관적 업데이트 규칙
 * - onMutate: 캐시를 먼저 바꾸고 스냅샷을 남긴다 → 버튼이 즉시 반응
 * - onError: 스냅샷으로 되돌린다 (호출부가 토스트를 띄운다)
 * - onSuccess: 서버 응답으로 캐시를 덮어쓴다. 목록 전체를 다시 불러오지 않는다
 * - onSettled: 목록을 stale 로만 표시해 다음 진입 때 조용히 새로 고친다
 */

/**
 * 업로드: 이미지 업로드가 끝나야 서버에 저장되므로 완전한 낙관 처리는 불가.
 * 대신 "업로드 중" 카드를 피드 맨 위에 먼저 보여주고, 끝나면 실제 게시글로 바꾼다.
 */
export function useCreateShot() {
  const queryClient = useQueryClient();
  const { data: profile } = useLocalProfile();
  const { data: trips = [] } = useTrips();
  return useMutation({
    mutationFn: async ({ input }: { input: ShotFormValues; pendingId: string }) =>
      shotRepository.create(input),
    onMutate: ({ input, pendingId }) => {
      const trip = trips.find((t) => t.id === input.tripId);
      const now = new Date().toISOString();
      pendingShots.add({
        id: pendingId,
        channel: input.channel,
        tripId: input.tripId,
        authorId: profile?.id ?? "",
        authorNickname: profile?.nickname || "나",
        authorAvatarDataUrl: profile?.avatarDataUrl ?? null,
        destinationCountry: trip?.country ?? "",
        destinationCity: trip?.city ?? "",
        images: input.images,
        pins: input.pins,
        body: input.body ?? "",
        shoppingItemIds: input.shoppingItemIds,
        likeCount: 0,
        likedByMe: false,
        shareCount: 0,
        comments: [],
        createdAt: now,
        updatedAt: now,
        pending: true,
      });
    },
    // 업로드 화면은 mutate 직후 언마운트되므로 결과 알림도 여기서 처리한다
    onSuccess: (shot, { pendingId }) => {
      pendingShots.remove(pendingId);
      prependShotToLists(queryClient, shot);
      markShotsStale(queryClient);
      toast.success("때샷을 올렸어요");
    },
    onError: (error, { pendingId }) => {
      pendingShots.remove(pendingId);
      toast.error(error instanceof Error ? error.message : "업로드에 실패했습니다");
    },
  });
}

export function useToggleShotLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shotRepository.toggleLike(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: shotKeys.all });
      const snapshot = snapshotShotCaches(queryClient);
      updateShotInCaches(queryClient, id, (shot) => ({
        ...shot,
        likedByMe: !shot.likedByMe,
        likeCount: Math.max(0, shot.likeCount + (shot.likedByMe ? -1 : 1)),
      }));
      return { snapshot };
    },
    onError: (_error, _id, context) => {
      if (context) restoreShotCaches(queryClient, context.snapshot);
    },
    onSuccess: (shot) => replaceShotInCaches(queryClient, shot),
    onSettled: () => markShotsStale(queryClient),
  });
}

export function useAddShotComment() {
  const queryClient = useQueryClient();
  const { data: profile } = useLocalProfile();
  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      shotRepository.addComment(id, text),
    onMutate: async ({ id, text }) => {
      await queryClient.cancelQueries({ queryKey: shotKeys.detail(id) });
      const snapshot = snapshotShotCaches(queryClient);
      const optimistic: ShotComment = {
        id: `pending-${Date.now()}`,
        authorId: profile?.id ?? "",
        authorNickname: profile?.nickname || "나",
        text,
        createdAt: new Date().toISOString(),
      };
      updateShotInCaches(queryClient, id, (shot) => ({
        ...shot,
        comments: [...shot.comments, optimistic],
      }));
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      if (context) restoreShotCaches(queryClient, context.snapshot);
    },
    onSuccess: (shot) => replaceShotInCaches(queryClient, shot),
    onSettled: () => markShotsStale(queryClient),
  });
}

export function useRemoveShotComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      shotId,
      commentId,
    }: {
      shotId: string;
      commentId: string;
    }) => shotRepository.removeComment(shotId, commentId),
    onMutate: async ({ shotId, commentId }) => {
      await queryClient.cancelQueries({ queryKey: shotKeys.detail(shotId) });
      const snapshot = snapshotShotCaches(queryClient);
      updateShotInCaches(queryClient, shotId, (shot) => ({
        ...shot,
        comments: shot.comments.filter((c) => c.id !== commentId),
      }));
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      if (context) restoreShotCaches(queryClient, context.snapshot);
    },
    onSuccess: (shot) => replaceShotInCaches(queryClient, shot),
    onSettled: () => markShotsStale(queryClient),
  });
}

export function useIncrementShotShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shotRepository.incrementShare(id),
    onMutate: (id) => {
      updateShotInCaches(queryClient, id, (shot) => ({
        ...shot,
        shareCount: shot.shareCount + 1,
      }));
    },
    onSuccess: (shot) => replaceShotInCaches(queryClient, shot),
  });
}

export function useUpdateShot(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ShotFormValues) =>
      shotRepository.update(
        id,
        input,
        queryClient.getQueryData<Shot>(shotKeys.detail(id)) ?? findShotInCaches(queryClient, id),
      ),
    onSuccess: (shot) => {
      replaceShotInCaches(queryClient, shot);
      queryClient.setQueryData(shotKeys.detail(id), shot);
      void queryClient.invalidateQueries({ queryKey: shotKeys.items(id) });
      markShotsStale(queryClient);
    },
  });
}

export function useDeleteShot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await shotRepository.remove(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: shotKeys.all });
      const snapshot = snapshotShotCaches(queryClient);
      removeShotFromCaches(queryClient, id);
      return { snapshot };
    },
    onError: (_error, _id, context) => {
      if (context) restoreShotCaches(queryClient, context.snapshot);
    },
    onSettled: () => {
      markShotsStale(queryClient);
      void queryClient.invalidateQueries({ queryKey: scrapKeys.all, refetchType: "none" });
    },
  });
}
