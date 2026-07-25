"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { HeaderNavActions } from "@/components/layout/header-nav-actions";
import { EmptyState } from "@/components/common/empty-state";
import { CouponSection } from "@/features/shopping/components/coupon-section";
import { MagazineList } from "@/features/shopping/components/magazine-list";
import { RecommendRail } from "@/features/shopping/components/recommend-rail";
import { ShoppingAdDialog } from "@/features/shopping/components/shopping-ad-dialog";
import { ShoppingDestinationFilter } from "@/features/shopping/components/shopping-destination-filter";
import { ShoppingSection } from "@/features/shopping/components/shopping-section";
import {
  DEMO_MAGAZINES,
  DEMO_MALLS,
  DEMO_RESTAURANTS,
  DEMO_SHOPPING_AD,
  DEMO_TOURS,
  SHOPPING_DESTINATION_OPTIONS,
  type ShoppingDestination,
} from "@/features/shopping/data/demo-shopping-content";
import {
  filterMagazineItems,
  filterRecommendItems,
} from "@/features/shopping/lib/filter-shopping-content";
import { listCouponDestinations } from "@/features/coupons/lib/filter-coupons";
import { useTaxFreeCoupons } from "@/features/coupons/hooks/use-taxfree-coupons";
import { cn } from "@/lib/utils";

function SectionDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-px w-full bg-border/80", className)}
      role="separator"
      aria-hidden
    />
  );
}

export default function ShoppingPage() {
  const [destination, setDestination] = useState<ShoppingDestination>(null);
  const { data: couponData } = useTaxFreeCoupons();

  const destinationOptions = useMemo(() => {
    const map = new Map<string, { city: string; country: string }>();
    for (const opt of SHOPPING_DESTINATION_OPTIONS) {
      map.set(`${opt.country}::${opt.city}`, opt);
    }
    for (const opt of listCouponDestinations(couponData?.coupons ?? [])) {
      map.set(`${opt.country}::${opt.city}`, opt);
    }
    return [...map.values()].sort((a, b) => a.city.localeCompare(b.city, "ko"));
  }, [couponData?.coupons]);

  const magazines = useMemo(
    () => filterMagazineItems(DEMO_MAGAZINES, destination),
    [destination],
  );
  const malls = useMemo(
    () => filterRecommendItems(DEMO_MALLS, destination),
    [destination],
  );
  const tours = useMemo(
    () => filterRecommendItems(DEMO_TOURS, destination),
    [destination],
  );
  const restaurants = useMemo(
    () => filterRecommendItems(DEMO_RESTAURANTS, destination),
    [destination],
  );

  return (
    <AppShell withBottomNav>
      <PageHeader title="쇼핑" actions={<HeaderNavActions />} />
      <ShoppingAdDialog ad={DEMO_SHOPPING_AD} />

      <div className="flex flex-col gap-4">
        <ShoppingDestinationFilter
          value={destination}
          options={destinationOptions}
          onChange={setDestination}
        />

        <div className="flex flex-col gap-4">
          <ShoppingSection
            title="매거진"
            description="여행 쇼핑에 도움 되는 짧은 가이드"
          >
            {magazines.length ? (
              <MagazineList items={magazines} />
            ) : (
              <EmptyState
                title="매거진이 없어요"
                description="선택한 여행지에 맞는 매거진이 아직 없습니다."
              />
            )}
          </ShoppingSection>

          <SectionDivider />

          <ShoppingSection
            title="요즘 뜨는 쇼핑몰"
            description="현지에서 자주 찾는 쇼핑 스팟"
          >
            {malls.length ? (
              <RecommendRail items={malls} ariaLabel="요즘 뜨는 쇼핑몰 목록" />
            ) : (
              <EmptyState
                title="쇼핑몰 추천이 없어요"
                description="선택한 여행지에 맞는 쇼핑몰이 아직 없습니다."
              />
            )}
          </ShoppingSection>

          <SectionDivider />

          <ShoppingSection
            title="투어 추천"
            description="쇼핑과 함께 즐기기 좋은 투어"
          >
            {tours.length ? (
              <RecommendRail items={tours} ariaLabel="투어 추천 목록" />
            ) : (
              <EmptyState
                title="투어 추천이 없어요"
                description="선택한 여행지에 맞는 투어가 아직 없습니다."
              />
            )}
          </ShoppingSection>

          <SectionDivider />

          <ShoppingSection
            title="고독한 미식가 나온 맛집"
            description="장보고 들르기 좋은 근처 맛집"
          >
            {restaurants.length ? (
              <RecommendRail
                items={restaurants}
                ariaLabel="고독한 미식가 나온 맛집 목록"
              />
            ) : (
              <EmptyState
                title="맛집 추천이 없어요"
                description="선택한 여행지에 맞는 맛집이 아직 없습니다."
              />
            )}
          </ShoppingSection>

          <SectionDivider />

          <CouponSection destination={destination} />
        </div>
      </div>
    </AppShell>
  );
}
