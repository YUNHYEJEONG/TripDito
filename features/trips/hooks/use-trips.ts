"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tripRepository } from "../data/trip-repository";
import type { Trip, TripFormValues } from "../schema";
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

/** 캐시(목록·상세)의 여행 하나를 갱신 */
function patchTripCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  patch: Partial<Trip>,
) {
  queryClient.setQueriesData<Trip[]>({ queryKey: tripKeys.all }, (old) =>
    Array.isArray(old) ? old.map((t) => (t.id === id ? { ...t, ...patch } : t)) : old,
  );
  queryClient.setQueryData<Trip>(tripKeys.detail(id), (old) =>
    old ? { ...old, ...patch } : old,
  );
}

/** 여행 마치기: 즉시 완료 상태로 표시하고, 실패하면 되돌린다 */
export function useCompleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tripRepository.complete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: tripKeys.all });
      const previous = queryClient.getQueryData<Trip>(tripKeys.detail(id));
      patchTripCaches(queryClient, id, { status: "DONE" });
      return { previous };
    },
    onError: (_error, id, context) => {
      if (context?.previous) patchTripCaches(queryClient, id, { status: context.previous.status });
    },
    onSuccess: (trip) => patchTripCaches(queryClient, trip.id, trip),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.all, refetchType: "none" });
    },
  });
}

/** 여권 도장 페이지 저장 (도장 연출은 로컬에서 먼저, 서버는 뒤따라 저장) */
export function useSetPassportPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pageNumber }: { id: string; pageNumber: number }) =>
      tripRepository.setPassportPage(id, pageNumber),
    onMutate: ({ id, pageNumber }) => {
      patchTripCaches(queryClient, id, { passportPage: pageNumber });
    },
    onSuccess: (trip) => patchTripCaches(queryClient, trip.id, trip),
  });
}
