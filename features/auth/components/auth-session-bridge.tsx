"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { authRepository } from "../data/auth-repository";
import { profileRepository } from "@/features/profile/data/profile-repository";
import { hasRegisteredProfile } from "@/features/profile/constants";
import { authKeys } from "../hooks/use-auth";
import { profileKeys } from "@/features/profile/hooks/use-local-profile";
import type { AuthProvider } from "../types";

function resolveProvider(provider?: string | null): AuthProvider {
  if (provider === "kakao") return "kakao";
  if (provider === "naver") return "naver";
  return "email";
}

/** next-auth OAuth 세션을 로컬 auth 상태와 동기화 (프로필은 자동 채우지 않음) */
export function AuthSessionBridge() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const syncedKey = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const key = `${session.user.email ?? ""}:${session.provider ?? ""}`;
    if (syncedKey.current === key && authRepository.get().isLoggedIn) return;

    const providerId = session.provider ?? null;
    const wasLoggedIn = authRepository.get().isLoggedIn;

    authRepository.login({
      provider: resolveProvider(providerId),
      email: session.user.email ?? null,
    });

    // 소셜 최초 로그인 시에만 프로필을 비움 (이미 등록된 프로필은 유지)
    if (!wasLoggedIn && !hasRegisteredProfile(profileRepository.get())) {
      profileRepository.clear();
    }

    syncedKey.current = key;
    void queryClient.invalidateQueries({ queryKey: authKeys.all });
    void queryClient.invalidateQueries({ queryKey: profileKeys.all });
  }, [queryClient, session, status]);

  return null;
}
