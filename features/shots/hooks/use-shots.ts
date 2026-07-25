"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shotRepository } from "../data/shot-repository";
import type { ShotFormValues } from "../schema";

import { scrapKeys } from "./use-scraps";

export const shotKeys = {
  all: ["shots"] as const,
  detail: (id: string) => ["shots", id] as const,
};

export function useShots() {
  return useQuery({
    queryKey: shotKeys.all,
    queryFn: () => shotRepository.list(),
  });
}

export function useShot(id: string) {
  return useQuery({
    queryKey: shotKeys.detail(id),
    queryFn: () => shotRepository.getById(id) ?? null,
    enabled: Boolean(id),
  });
}

export function useCreateShot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ShotFormValues) => shotRepository.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shotKeys.all });
    },
  });
}

export function useToggleShotLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => shotRepository.toggleLike(id),
    onSuccess: (shot) => {
      void queryClient.invalidateQueries({ queryKey: shotKeys.all });
      void queryClient.invalidateQueries({
        queryKey: shotKeys.detail(shot.id),
      });
    },
  });
}

export function useAddShotComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) =>
      shotRepository.addComment(id, text),
    onSuccess: (shot) => {
      void queryClient.invalidateQueries({ queryKey: shotKeys.all });
      void queryClient.invalidateQueries({
        queryKey: shotKeys.detail(shot.id),
      });
    },
  });
}

export function useRemoveShotComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      shotId,
      commentId,
    }: {
      shotId: string;
      commentId: string;
    }) => shotRepository.removeComment(shotId, commentId),
    onSuccess: (shot) => {
      void queryClient.invalidateQueries({ queryKey: shotKeys.all });
      void queryClient.invalidateQueries({
        queryKey: shotKeys.detail(shot.id),
      });
    },
  });
}

export function useIncrementShotShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => shotRepository.incrementShare(id),
    onSuccess: (shot) => {
      void queryClient.invalidateQueries({ queryKey: shotKeys.all });
      void queryClient.invalidateQueries({
        queryKey: shotKeys.detail(shot.id),
      });
    },
  });
}

export function useUpdateShot(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ShotFormValues) =>
      shotRepository.update(id, input),
    onSuccess: (shot) => {
      void queryClient.invalidateQueries({ queryKey: shotKeys.all });
      void queryClient.invalidateQueries({
        queryKey: shotKeys.detail(shot.id),
      });
    },
  });
}

export function useDeleteShot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      shotRepository.remove(id);
      return id;
    },
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: shotKeys.all });
      void queryClient.invalidateQueries({ queryKey: shotKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: scrapKeys.all });
    },
  });
}
