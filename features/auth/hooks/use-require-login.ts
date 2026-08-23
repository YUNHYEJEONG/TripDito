"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useIsLoggedIn } from "./use-auth";

/** 로그인 필수 페이지: 미로그인이면 /login 으로 보내고 돌아올 경로를 넘긴다 */
export function useRequireLogin() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isLoading } = useIsLoggedIn();

  useEffect(() => {
    if (isLoading || isLoggedIn) return;
    router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }, [isLoading, isLoggedIn, pathname, router]);

  return { isLoggedIn, isLoading };
}
