"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { authRepository } from "../data/auth-repository";
import { accountRepository } from "../data/account-repository";
import { profileRepository } from "@/features/profile/data/profile-repository";
import { profileKeys } from "@/features/profile/hooks/use-local-profile";
import type { AuthProvider } from "../types";

export const authKeys = {
  all: ["auth"] as const,
};

export function useAuthSession() {
  return useQuery({
    queryKey: authKeys.all,
    queryFn: () => authRepository.get(),
  });
}

export function useIsLoggedIn() {
  const { data, isLoading } = useAuthSession();
  return {
    isLoggedIn: Boolean(data?.isLoggedIn),
    isLoading,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input?: {
      provider?: AuthProvider;
      email?: string | null;
    }) => {
      return authRepository.login({
        provider: input?.provider,
        email: input?.email,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.all });
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useEmailLogin() {
  const login = useLogin();
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const account = await accountRepository.verify(
        input.email,
        input.password,
      );
      // 계정 닉네임으로 프로필을 채우지 않음 — 프로필은 별도 등록
      return login.mutateAsync({
        provider: "email",
        email: account.email,
      });
    },
  });
}

export function useEmailSignup() {
  const login = useLogin();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      nickname: string;
      email: string;
      password: string;
      homeCountry: string;
    }) => {
      const account = await accountRepository.create(input);
      // 최초 회원가입 후 프로필은 미등록 상태
      profileRepository.clear();
      return login.mutateAsync({
        provider: "email",
        email: account.email,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const session = authRepository.logout();
      try {
        await signOut({ redirect: false });
      } catch {
        // OAuth 세션이 없어도 로컬 로그아웃은 진행
      }
      return session;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}
