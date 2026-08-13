"use client";

import Link from "next/link";
import { ChevronRight, Ticket } from "lucide-react";

export function HomeCouponBanner({
  city,
  country,
  couponCount,
  source,
}: {
  city: string;
  country: string;
  couponCount: number;
  source: "live" | "fallback";
}) {
  if (couponCount <= 0) return null;

  return (
    <Link
      href={`/shopping?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}#coupons`}
      className="flex min-h-14 items-center gap-2 rounded-xl bg-paper-2 px-4 py-3 outline-none transition-colors duration-120 hover:bg-paper-3 active:bg-paper focus-visible:ring-2 focus-visible:ring-focus"
    >
      <Ticket className="size-5 shrink-0 text-accent-text" aria-hidden />
      <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-ink">
        {source === "live" ? (
          <>
            <span className="font-semibold text-accent-text">{city}</span>
            에서 쓸 수 있는 쿠폰{" "}
            <span className="font-semibold text-accent-text">
              {couponCount}개
            </span>
          </>
        ) : (
          <>저장된 쿠폰 후보 {couponCount}개 · 조건 재확인</>
        )}
      </p>
      <ChevronRight className="size-5 shrink-0 text-ink-2" aria-hidden />
      <span className="sr-only">쿠폰 보기</span>
    </Link>
  );
}
