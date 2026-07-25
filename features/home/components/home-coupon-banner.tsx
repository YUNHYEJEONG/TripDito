"use client";

import Link from "next/link";
import { ChevronRight, Ticket } from "lucide-react";

export function HomeCouponBanner({
  city,
  couponCount,
}: {
  city: string;
  couponCount: number;
}) {
  if (couponCount <= 0) return null;

  return (
    <Link
      href="/shopping"
      className="flex items-center gap-2.5 rounded-xl bg-brand-soft px-3.5 py-2.5 transition-colors active:bg-brand-soft/80"
    >
      <Ticket className="size-4 shrink-0 text-primary" aria-hidden />
      <p className="min-w-0 flex-1 truncate text-[13px] font-medium leading-snug text-foreground">
        <span className="font-semibold text-primary">{city}</span>
        에서 쓸 수 있는 쿠폰{" "}
        <span className="font-semibold text-primary">{couponCount}개</span>{" "}
        다운로드
      </p>
      <ChevronRight className="size-5 shrink-0 text-primary" aria-hidden />
      <span className="sr-only">쇼핑 탭으로 이동</span>
    </Link>
  );
}
