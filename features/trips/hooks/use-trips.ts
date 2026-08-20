"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tripRepository } from "../data/trip-repository";
import type { TripFormValues } from "../schema";

export const tripKeys = {
  all: ["trips"] as const,
  detail: (id: string) => ["trips", id] as const,
};

export function useTrips() {
  return useQuery({
    queryKey: tripKeys.all,
    queryFn: () => tripRepository.list(),
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: () => tripRepository.getById(id) ?? null,
    enabled: Boolean(id),
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TripFormValues) => tripRepository.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useUpdateTrip(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TripFormValues) => tripRepository.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.all });
      void queryClient.invalidateQueries({ queryKey: tripKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useUpdateTripBudget(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<typeof tripRepository.updateBudget>[1],
    ) => tripRepository.updateBudget(id, input),
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
      tripRepository.remove(id);
      return id;
    },
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.all });
      void queryClient.invalidateQueries({ queryKey: tripKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: ["items"] });
      void queryClient.invalidateQueries({ queryKey: ["shots"] });
    },
  });
}
