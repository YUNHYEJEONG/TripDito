"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { BrandLogo } from "@/components/brand/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SignupCompletePage() {
  return (
    <AppShell>
      <PageHeader brand title="회원가입 완료" />

      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-8 px-1 text-center">
        <BrandLogo variant="full" size="lg" href={null} />

        <div className="flex flex-col gap-2">
          <h2 className="text-[22px] font-bold tracking-tight text-foreground">
            회원가입 완료!
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            캐리어는 열었고, 쇼핑리스트는 비어 있어요.
            <br />
            트립디토랑 첫 여행부터 가볍게 채워볼까요?
          </p>
        </div>

        <div className="flex w-full flex-col gap-2.5">
          <Link
            href="/trips/new"
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            여행지 등록
          </Link>
          <Link
            href="/home"
            className={cn(
              buttonVariants({ variant: "surfaceOutline", size: "lg" }),
              "w-full",
            )}
          >
            홈화면 이동
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
