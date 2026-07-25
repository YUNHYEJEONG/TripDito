"use client";

import { EmptyState } from "@/components/common/empty-state";
import { CouponCardList } from "@/features/coupons/components/coupon-card-list";
import { useTaxFreeCoupons } from "@/features/coupons/hooks/use-taxfree-coupons";
import { filterCouponsByDestination } from "@/features/coupons/lib/filter-coupons";
import type { ShoppingDestination } from "../data/demo-shopping-content";
import { ShoppingSection } from "./shopping-section";
import { useMemo } from "react";

export function CouponSection({
  destination,
}: {
  destination: ShoppingDestination;
}) {
  const { data, isLoading, isError } = useTaxFreeCoupons();
  const coupons = data?.coupons ?? [];
  const filtered = useMemo(
    () => filterCouponsByDestination(coupons, destination),
    [coupons, destination],
  );

  return (
    <ShoppingSection id="coupons" title="쿠폰">
      {isLoading ? (
        <p className="py-6 text-center text-[13px] text-muted-foreground">
          불러오는 중…
        </p>
      ) : isError && !data ? (
        <EmptyState
          title="쿠폰을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="쿠폰이 없어요"
          description="선택한 여행지에 맞는 쿠폰이 아직 없습니다."
        />
      ) : (
        <CouponCardList coupons={filtered} />
      )}
    </ShoppingSection>
  );
}
