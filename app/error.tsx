"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AppShell>
      <PageHeader title="오류" backHref="/home" />
      <section
        className="mx-auto flex min-h-[64vh] w-full max-w-md flex-col items-center justify-center gap-3 text-center"
        aria-labelledby="error-title"
      >
        <div className="space-y-3" role="alert">
          <h2
            id="error-title"
            className="text-[22px] leading-[1.35] font-bold tracking-[-0.02em] text-ink"
          >
            화면을 불러오지 못했어요
          </h2>
          <p className="max-w-sm text-[15px] leading-6 text-ink-2">
            잠시 후 다시 시도해 주세요. 같은 문제가 이어지면 홈으로 돌아가 다른
            화면을 이용할 수 있어요.
          </p>
        </div>
        <div className="mt-3 grid w-full grid-cols-2 gap-3">
          <Link
            href="/home"
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "w-full",
            )}
          >
            홈으로 돌아가기
          </Link>
          <Button className="w-full" onClick={unstable_retry}>
            다시 불러오기
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
