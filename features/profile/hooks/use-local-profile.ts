"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileRepository } from "../data/profile-repository";
import type { LocalProfileFormValues } from "../schema";

export const profileKeys = {
  all: ["profile"] as const,
};

export function useLocalProfile() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: () => profileRepository.get(),
  });
}

export function useUpdateLocalProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LocalProfileFormValues) =>
      profileRepository.update(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
