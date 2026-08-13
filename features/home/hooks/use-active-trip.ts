"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { activeTripRepository } from "../data/active-trip-repository";

export const activeTripKeys = {
  current: ["active-trip"] as const,
};

export function useActiveTripId() {
  return useQuery({
    queryKey: activeTripKeys.current,
    queryFn: () => activeTripRepository.get(),
  });
}

export function useSelectActiveTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tripId: string) => activeTripRepository.set(tripId),
    onSuccess: (tripId) => {
      queryClient.setQueryData(activeTripKeys.current, tripId);
    },
  });
}
