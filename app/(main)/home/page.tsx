"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  HomeSkeleton,
  LoadingRegion,
} from "@/components/common/loading-skeletons";
import { CardStack } from "@/components/layout/card-stack";
import { PageHeader } from "@/components/layout/page-header";
import { HeaderNavActions } from "@/components/layout/header-nav-actions";
import { HomeAdBanner } from "@/features/home/components/home-ad-banner";
import { HomeAddFab } from "@/features/home/components/home-add-fab";
import { HomeCouponBanner } from "@/features/home/components/home-coupon-banner";
import { HomeCreateTripCta } from "@/features/home/components/home-create-trip-cta";
import { HomeFxCard } from "@/features/home/components/home-fx-card";
import { HomeGuestDiscover } from "@/features/home/components/home-guest-discover";
import { HomeShoppingTodo } from "@/features/home/components/home-shopping-todo";
import { HomeUpcomingTripCard } from "@/features/home/components/home-upcoming-trip-card";
import { getUpcomingTrip } from "@/features/home/utils/get-upcoming-trip";
import { useTaxFreeCoupons } from "@/features/coupons/hooks/use-taxfree-coupons";
import { filterCouponsByDestination } from "@/features/coupons/lib/filter-coupons";
import { useTrips } from "@/features/trips/hooks/use-trips";
import { tripProgress } from "@/features/trips/utils/trip-progress";
import { appConfig } from "@/config/app";

export default function HomePage() {
  const { data: trips = [], isLoading } = useTrips();
  const { data: couponData } = useTaxFreeCoupons();
  const upcoming = getUpcomingTrip(trips);
  const destinationCoupons =
    upcoming && couponData?.coupons
      ? filterCouponsByDestination(couponData.coupons, {
          city: upcoming.city,
          country: upcoming.country,
        })
      : [];

  return (
    <AppShell withBottomNav>
      <PageHeader brand title={appConfig.name} actions={<HeaderNavActions />} />

      {isLoading ? (
        <LoadingRegion>
          <HomeSkeleton />
        </LoadingRegion>
      ) : (
        <CardStack>
          {upcoming ? (
            <>
              <HomeUpcomingTripCard
                trip={upcoming}
                progress={tripProgress(upcoming)}
                requiredBudget={upcoming.stats?.estimatedTotal ?? 0}
              />

              <HomeCouponBanner
                city={upcoming.city}
                couponCount={destinationCoupons.length}
              />

              <HomeShoppingTodo
                tripId={upcoming.id}
                currency={upcoming.currency}
                startDate={upcoming.startDate}
                endDate={upcoming.endDate}
              />

              <HomeFxCard currency={upcoming.currency} />
            </>
          ) : (
            <>
              <HomeCreateTripCta />
              <HomeGuestDiscover />
            </>
          )}

          <HomeAdBanner />
          {upcoming ? (
            /* 우측 하단 FAB 가 마지막 카드를 가리지 않도록 */
            <div className="h-12" aria-hidden />
          ) : null}
        </CardStack>
      )}

      {!isLoading && upcoming ? <HomeAddFab tripId={upcoming.id} /> : null}
    </AppShell>
  );
}
