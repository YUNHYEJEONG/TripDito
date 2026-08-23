"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signIn, signOut, useSession } from "next-auth/react";
import type { AuthProvider, AuthSession } from "../types";

export const authKeys = {
  all: ["auth"] as const,
};

function resolveProvider(provider?: string | null): AuthProvider | null {
  if (
    provider === "google" ||
    provider === "kakao" ||
    provider === "naver" ||
    provider === "dev"
  ) {
    return provider;
  }
  return null;
}

/** next-auth 세션을 앱의 AuthSession 형태로 노출 */
export function useAuthSession() {
  const { data: session, status } = useSession();
  const data: AuthSession = {
    isLoggedIn: status === "authenticated" && Boolean(session?.userUuid),
    loggedInAt: null,
    provider: resolveProvider(session?.provider),
    email: session?.user?.email ?? null,
    userId: session?.userUuid ?? null,
  };
  return { data, isLoading: status === "loading" };
}

export function useIsLoggedIn() {
  const { data, isLoading } = useAuthSession();
  return { isLoggedIn: data.isLoggedIn, isLoading };
}

/** 소셜 로그인 시작 (리다이렉트) */
export function useSocialLogin() {
  return useMutation({
    mutationFn: async (input: {
      provider: AuthProvider;
      callbackUrl?: string;
    }) => {
      await signIn(input.provider, {
        callbackUrl: input.callbackUrl ?? "/profile",
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await signOut({ redirect: false });
    },
    onSuccess: () => {
      // 사용자 데이터 캐시를 모두 비운다
      queryClient.clear();
    },
  });
}
