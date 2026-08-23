"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SocialLoginButtons } from "@/features/auth/components/social-login-buttons";
import { DevLoginForm } from "@/features/auth/components/dev-login-form";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";
import { appConfig } from "@/config/app";

/** useSearchParams 는 정적 프리렌더 시 Suspense 경계가 필요하다 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

/** 소셜 로그인 전용 (이메일 가입 경로는 정책상 제공하지 않는다) */
function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading } = useIsLoggedIn();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/profile";
  const error = searchParams.get("error");

  useEffect(() => {
    if (!isLoading && isLoggedIn) router.replace(callbackUrl);
  }, [callbackUrl, isLoading, isLoggedIn, router]);

  return (
    <AppShell>
      <PageHeader brand title="로그인" />

      <div className="mx-auto flex w-full max-w-md flex-col gap-6 pt-2">
        <div className="flex flex-col gap-1.5 text-center">
          <h2 className="text-[22px] font-bold tracking-tight text-foreground">
            {appConfig.name} 시작하기
          </h2>
          <p className="text-[13px] text-muted-foreground">
            소셜 계정으로 간편하게 로그인하세요.
            <br />
            같은 이메일이면 어떤 계정으로 들어와도 하나의 회원으로 연결돼요.
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-[13px] text-destructive"
          >
            {error === "AccessDenied"
              ? "탈퇴했거나 로그인할 수 없는 계정입니다"
              : "로그인에 실패했습니다. 다시 시도해 주세요"}
          </p>
        ) : null}

        <SocialLoginButtons callbackUrl={callbackUrl} />

        <DevLoginForm callbackUrl={callbackUrl} />
      </div>
    </AppShell>
  );
}
