"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { CardStack } from "@/components/layout/card-stack";
import { PageHeader } from "@/components/layout/page-header";
import { HeaderNavActions } from "@/components/layout/header-nav-actions";
import { HomeAdBanner } from "@/features/home/components/home-ad-banner";
import { HomeCouponBanner } from "@/features/home/components/home-coupon-banner";
import { HomeCreateTripCta } from "@/features/home/components/home-create-trip-cta";
import { HomeFxCard } from "@/features/home/components/home-fx-card";
import { HomeShoppingTodo } from "@/features/home/components/home-shopping-todo";
import { HomeUpcomingTripCard } from "@/features/home/components/home-upcoming-trip-card";
import { getUpcomingTrip } from "@/features/home/utils/get-upcoming-trip";
import { useTaxFreeCoupons } from "@/features/coupons/hooks/use-taxfree-coupons";
import { filterCouponsByDestination } from "@/features/coupons/lib/filter-coupons";
import { useItems } from "@/features/shopping-items/hooks/use-items";
import { useTrips } from "@/features/trips/hooks/use-trips";
import { calculateBudget } from "@/features/budget/utils/calculate-budget";
import { appConfig } from "@/config/app";

function UpcomingTripWithStats({
  tripId,
  children,
}: {
  tripId: string;
  children: (stats: {
    progress?: number;
    requiredBudget: number;
  }) => React.ReactNode;
}) {
  const { data: items = [] } = useItems(tripId);
  const summary = calculateBudget(0, items);
  return (
    <>
      {children({
        progress: items.length ? summary.purchaseProgress : undefined,
        requiredBudget: summary.estimatedTotal,
      })}
    </>
  );
}

export default function HomePage() {
  const { data: trips = [], isLoading } = useTrips();
  const { data: couponData } = useTaxFreeCoupons();
  const upcoming = getUpcomingTrip(trips);
  const destinationCoupons = useMemo(() => {
    if (!upcoming || !couponData?.coupons) return [];
    return filterCouponsByDestination(couponData.coupons, {
      city: upcoming.city,
      country: upcoming.country,
    });
  }, [upcoming, couponData?.coupons]);

  return (
    <AppShell withBottomNav>
      <PageHeader
        brand
        title={appConfig.name}
        actions={<HeaderNavActions />}
      />

      {isLoading ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          불러오는 중…
        </p>
      ) : (
        <CardStack>
          {upcoming ? (
            <>
              <UpcomingTripWithStats tripId={upcoming.id}>
                {({ progress, requiredBudget }) => (
                  <HomeUpcomingTripCard
                    trip={upcoming}
                    progress={progress}
                    requiredBudget={requiredBudget}
                  />
                )}
              </UpcomingTripWithStats>

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
            <HomeCreateTripCta />
          )}

          <HomeAdBanner />
        </CardStack>
      )}
    </AppShell>
  );
}
