"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { CouponCardList } from "@/features/coupons/components/coupon-card-list";
import { useTaxFreeCoupons } from "@/features/coupons/hooks/use-taxfree-coupons";
import { filterCouponsByDestination } from "@/features/coupons/lib/filter-coupons";
import type { ShoppingDestination } from "../data/demo-shopping-content";
import { ShoppingSection } from "./shopping-section";

const COLLAPSED_COUPON_COUNT = 4;

export function CouponSection({
  destination,
}: {
  destination: ShoppingDestination;
}) {
  const { data, isLoading, isError, isFetching, refetch } =
    useTaxFreeCoupons();
  const [expanded, setExpanded] = useState(false);
  const filtered = useMemo(
    () => filterCouponsByDestination(data?.coupons ?? [], destination),
    [data?.coupons, destination],
  );
  const visibleCoupons = expanded
    ? filtered
    : filtered.slice(0, COLLAPSED_COUPON_COUNT);
  const hiddenCount = Math.max(0, filtered.length - COLLAPSED_COUPON_COUNT);

  return (
    <ShoppingSection
      id="coupons"
      title="면세 쿠폰"
      description="받아둔 쿠폰은 프로필에서 다시 열 수 있어요."
    >
      {data?.source === "fallback" ? (
        <div
          role="status"
          className="mb-4 rounded-xl border border-rule bg-paper-2 p-4"
        >
          <p className="text-[13px] leading-5 text-ink">
            {data.updatedAt
              ? `${data.updatedAt.replaceAll("-", ".")} 저장본이에요.`
              : "저장된 쿠폰 목록이에요."}{" "}
            혜택과 사용 조건은 제공처에서 다시 확인해 주세요.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isFetching}
              onClick={() => void refetch()}
              className="inline-flex min-h-11 items-center rounded-lg bg-ink px-3 text-[13px] font-semibold text-paper outline-none hover:bg-ink-2 active:bg-ink focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:bg-ink-2 disabled:text-paper/70"
            >
              {isFetching ? "확인하는 중…" : "혜택 다시 확인"}
            </button>
            <a
              href={data.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-[13px] font-semibold text-accent-text outline-none hover:bg-paper-3 active:bg-paper focus-visible:ring-2 focus-visible:ring-focus"
            >
              제공처 열기
              <ArrowUpRight className="ml-1 size-4" aria-hidden />
              <span className="sr-only">새 창</span>
            </a>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <p className="py-6 text-center text-[13px] text-ink-2">
          쿠폰을 불러오는 중이에요
        </p>
      ) : isError && !data ? (
        <EmptyState
          title="쿠폰을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="쿠폰이 없어요"
          description="다른 여행지를 선택해 확인해 보세요."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <CouponCardList
            coupons={visibleCoupons}
            action={data?.source === "live" ? "receive" : "none"}
          />
          {hiddenCount > 0 ? (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-paper-2 px-4 text-[13px] font-semibold text-ink outline-none transition-colors duration-120 hover:bg-paper-3 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              {expanded ? "쿠폰 접기" : `쿠폰 ${hiddenCount}장 더 보기`}
            </button>
          ) : null}
        </div>
      )}
    </ShoppingSection>
  );
}
