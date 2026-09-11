"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useIsLoggedIn } from "./use-auth";

/**
 * 로그인이 필요한 "동작" 앞에 두는 게이트 (페이지 전체를 막는 useRequireLogin 과 다르다).
 * 비로그인이면 안내 토스트를 띄우고 로그인 화면으로 보내며 false 를 돌려준다.
 * 로그인 뒤에는 현재 화면(또는 지정한 callbackUrl)으로 돌아온다.
 */
export function useLoginGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn } = useIsLoggedIn();

  return useCallback(
    (options: { message?: string; callbackUrl?: string } = {}) => {
      if (isLoggedIn) return true;
      const callbackUrl = options.callbackUrl ?? pathname ?? "/";
      toast(options.message ?? "로그인이 필요해요");
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return false;
    },
    [isLoggedIn, pathname, router],
  );
}
