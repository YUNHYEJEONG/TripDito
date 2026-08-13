"use client";

import Link from "next/link";
import { Plane } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeCreateTripCta() {
  return (
    <section className="rounded-2xl bg-paper-2 p-5">
      <div className="max-w-[34rem]">
        <p className="text-[13px] font-semibold text-accent-text">첫 여행 준비</p>
        <h1 className="mt-2 text-[28px] font-bold leading-[1.3] tracking-[-0.02em] text-ink">
          다음 여행의 쇼핑부터 정리해 보세요
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-ink-2">
          일정과 예산을 등록하면 환율, 쿠폰, 살 물건을 한곳에서 볼 수 있어요.
        </p>
        <Link
          href="/trips/new"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-5 w-full",
          )}
        >
          <Plane className="-rotate-45" />
          여행 만들기
        </Link>
      </div>
    </section>
  );
}
