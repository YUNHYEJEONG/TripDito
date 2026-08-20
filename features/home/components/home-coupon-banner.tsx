"use client";

import Link from "next/link";
import { ChevronRight, Ticket } from "lucide-react";

/**
 * 문구는 **어디서 · 몇 개 · 무엇을 한다** 한 줄로 고정한다 —
 * `도쿄에서 쓸 수 있는 쿠폰 11개 다운로드`.
 *
 * 쿠폰 데이터가 실시간인지 저장본인지(`source`)로 문구를 가르지 않는다. 사용자가 할 일은
 * 어느 쪽이든 똑같은데 `조건 재확인` 같은 말이 붙으면 행동이 흐려지고, 같은 자리에서
 * 문장 구조가 바뀌어 읽는 사람이 매번 다시 해석해야 한다.
 */
export function HomeCouponBanner({
  city,
  country,
  couponCount,
  loading = false,
}: {
  city: string;
  country: string;
  couponCount: number;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div
        className="flex min-h-14 items-center gap-2 rounded-xl bg-paper-2 px-4 py-3 text-[13px] text-ink-2"
        role="status"
        aria-live="polite"
      >
        <Ticket className="size-5 shrink-0 text-ink-3" aria-hidden />
        쿠폰을 확인하고 있어요.
      </div>
    );
  }

  const hasCoupons = couponCount > 0;

  return (
    <Link
      href={`/shopping?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}${hasCoupons ? "#coupons" : ""}`}
      className="flex min-h-14 items-center gap-2 rounded-xl bg-paper-2 px-4 py-3 outline-none transition-colors duration-120 hover:bg-paper-3 active:bg-paper focus-visible:ring-2 focus-visible:ring-focus"
    >
      <Ticket className="size-5 shrink-0 text-accent-text" aria-hidden />
      <p className="min-w-0 flex-1 text-[13px] leading-snug font-medium text-ink">
        {hasCoupons ? (
          <>
            <span className="font-semibold text-accent-text">{city}</span>
            에서 쓸 수 있는 쿠폰{" "}
            <span className="font-semibold text-accent-text tabular-nums">
              {couponCount}개
            </span>{" "}
            다운로드
          </>
        ) : (
          <>{city} 쇼핑 혜택 둘러보기</>
        )}
      </p>
      <ChevronRight className="size-5 shrink-0 text-ink-2" aria-hidden />
    </Link>
  );
}
