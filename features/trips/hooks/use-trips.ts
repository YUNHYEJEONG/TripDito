"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tripRepository } from "../data/trip-repository";
import type { TripFormValues } from "../schema";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";

export const tripKeys = {
  all: ["trips"] as const,
  detail: (id: string) => ["trips", id] as const,
};

/** 내 여행 목록 (미로그인이면 빈 목록) */
export function useTrips() {
  const { isLoggedIn, isLoading } = useIsLoggedIn();
  return useQuery({
    queryKey: [...tripKeys.all, isLoggedIn],
    queryFn: () => (isLoggedIn ? tripRepository.list() : []),
    enabled: !isLoading,
  });
}

export function useTrip(id: string) {
  const { isLoggedIn } = useIsLoggedIn();
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: () => tripRepository.getById(id),
    enabled: Boolean(id) && isLoggedIn,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TripFormValues) => tripRepository.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useUpdateTrip(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TripFormValues) => tripRepository.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.all });
      void queryClient.invalidateQueries({ queryKey: tripKeys.detail(id) });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await tripRepository.remove(id);
      return id;
    },
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.all });
      void queryClient.invalidateQueries({ queryKey: tripKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
