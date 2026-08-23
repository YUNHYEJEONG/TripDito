"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  profileRepository,
  type ProfileUpdateInput,
} from "../data/profile-repository";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";
import { EMPTY_PROFILE } from "../constants";

export const profileKeys = {
  all: ["profile"] as const,
};

/** 내 프로필 (서버). 미로그인이면 빈 프로필 */
export function useLocalProfile() {
  const { isLoggedIn, isLoading } = useIsLoggedIn();
  const query = useQuery({
    queryKey: [...profileKeys.all, isLoggedIn],
    queryFn: () => (isLoggedIn ? profileRepository.get() : EMPTY_PROFILE),
    enabled: !isLoading,
  });
  return query;
}

export function useUpdateLocalProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileUpdateInput) => profileRepository.update(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["shots"] });
    },
  });
}
