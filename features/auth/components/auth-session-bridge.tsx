"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { authRepository } from "../data/auth-repository";
import { profileRepository } from "@/features/profile/data/profile-repository";
import { hasRegisteredProfile } from "@/features/profile/constants";
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

    const key = `${session.user.email ?? ""}:${session.provider ?? ""}:${session.accountId ?? ""}`;
    if (syncedKey.current === key && authRepository.get().isLoggedIn) return;

    const providerId = session.provider ?? null;
    const localSession = authRepository.get();
    const wasLoggedIn = localSession.isLoggedIn;
    const provider = resolveProvider(providerId);
    const email = session.user.email?.trim().toLowerCase() ?? null;
    const accountId = session.accountId ?? null;
    const sameAccount =
      localSession.isLoggedIn &&
      localSession.provider === provider &&
      (localSession.email?.trim().toLowerCase() ?? null) === email &&
      (localSession.accountId ?? null) === accountId;

    // A cross-tab reload must not rewrite loggedInAt for an unchanged OAuth
    // identity, otherwise two open tabs can reload each other indefinitely.
    if (sameAccount) {
      syncedKey.current = key;
      return;
    }

    authRepository.login({
      provider,
      email,
      accountId,
    });

    // 소셜 최초 로그인 시에만 프로필을 비움 (이미 등록된 프로필은 유지)
    if (!wasLoggedIn && !hasRegisteredProfile(profileRepository.get())) {
      profileRepository.clear();
    }

    syncedKey.current = key;
    // OAuth can replace an already active local account. Reset every cached
    // repository view together to avoid briefly exposing the prior account.
    void queryClient.resetQueries();
  }, [queryClient, session, status]);

  return null;
}
