"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";
import {
  clearSignupCompletion,
  isSignupCompletionValid,
} from "@/features/auth/lib/signup-completion";
import { getSafeReturnTo, withReturnTo } from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";

const subscribeToCompletion = () => () => {};
const getServerCompletionSnapshot = () => false;

export default function SignupCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading } = useIsLoggedIn();
  const requestedReturnTo = searchParams.get("returnTo");
  const completionToken = searchParams.get("completion");
  const returnTo = requestedReturnTo
    ? getSafeReturnTo(requestedReturnTo, "/home")
    : null;
  const getCompletionSnapshot = useCallback(
    () => isSignupCompletionValid(completionToken),
    [completionToken],
  );
  const hasValidCompletion = useSyncExternalStore(
    subscribeToCompletion,
    getCompletionSnapshot,
    getServerCompletionSnapshot,
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      router.replace(withReturnTo("/signup", returnTo ?? "/home"));
      return;
    }

    if (!hasValidCompletion) router.replace(returnTo ?? "/home");
  }, [hasValidCompletion, isLoading, isLoggedIn, returnTo, router]);

  if (isLoading || !isLoggedIn || !hasValidCompletion) {
    return (
      <AppShell>
        <p className="py-16 text-center text-[13px] text-ink-2" role="status">
          가입 상태를 확인하는 중…
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="가입 완료" backHref="/home" />
      <main
        className="mx-auto flex min-h-[64vh] w-full max-w-md flex-col items-center justify-center gap-7 text-center"
        aria-labelledby="signup-complete-title"
      >
        <CircleCheck
          className="size-10 text-success-text"
          strokeWidth={1.8}
          aria-hidden
        />
        <div className="space-y-2">
          <h2
            id="signup-complete-title"
            className="text-[22px] leading-[1.35] font-bold tracking-[-0.02em] text-ink"
          >
            계정을 만들었어요
          </h2>
          <p className="text-[15px] leading-6 text-ink-2">
            이제 첫 여행을 만들고 필요한 상품을 쇼핑리스트에 담아 보세요.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Link
            href={returnTo ?? "/trips/new"}
            className={cn(buttonVariants(), "w-full")}
            onClick={clearSignupCompletion}
          >
            {returnTo ? "계속하기" : "첫 여행 만들기"}
          </Link>
          <Link
            href="/home"
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "w-full",
            )}
            onClick={clearSignupCompletion}
          >
            홈에서 둘러보기
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
