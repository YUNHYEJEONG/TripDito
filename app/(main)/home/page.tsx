"use client";

import { AppShell } from "@/components/layout/app-shell";
import { HeaderNavActions } from "@/components/layout/header-nav-actions";
import { PageHeader } from "@/components/layout/page-header";
import { appConfig } from "@/config/app";
import { calculateBudget } from "@/features/budget/utils/calculate-budget";
import { useTaxFreeCoupons } from "@/features/coupons/hooks/use-taxfree-coupons";
import { filterCouponsByDestination } from "@/features/coupons/lib/filter-coupons";
import { HomeAdBanner } from "@/features/home/components/home-ad-banner";
import { HomeCouponBanner } from "@/features/home/components/home-coupon-banner";
import { HomeShoppingEmpty } from "@/features/home/components/home-create-trip-cta";
import { HomeFxCard } from "@/features/home/components/home-fx-card";
import {
  HOME_ADD_FAB_CLEARANCE_CLASSNAME,
  HomeShoppingTodo,
} from "@/features/home/components/home-shopping-todo";
import { HomeUpcomingTripCard } from "@/features/home/components/home-upcoming-trip-card";
import { TripSwitchSheet } from "@/features/home/components/trip-switch-sheet";
import {
  getTripHomeMode,
  resolveHomeTrip,
} from "@/features/home/utils/get-home-mode";
import { todayIsoDate } from "@/features/home/utils/get-upcoming-trip";
import { getHomeChecklistMode } from "@/features/home/utils/home-shopping-list";
import {
  useActiveTripId,
  useSelectActiveTrip,
} from "@/features/home/hooks/use-active-trip";
import { useItems } from "@/features/shopping-items/hooks/use-items";
import { useTrips } from "@/features/trips/hooks/use-trips";
import { useHydrated } from "@/lib/react/use-hydrated";

export default function HomePage() {
  const hydrated = useHydrated();
  const { data: selectedTripId = null } = useActiveTripId();
  const selectActiveTrip = useSelectActiveTrip();
  const { data: trips = [], isLoading: tripsLoading } = useTrips();
  const today = todayIsoDate();
  const homeTrip = resolveHomeTrip(trips, selectedTripId, today);
  const mode = homeTrip ? getTripHomeMode(homeTrip, today) : "idle";
  const checklistMode = getHomeChecklistMode(mode);
  const isLoading = !hydrated || tripsLoading;
  const { data: items = [] } = useItems(homeTrip?.id ?? "");
  const summary = calculateBudget(homeTrip?.budget ?? 0, items);
  const { data: couponData, isLoading: couponsLoading } = useTaxFreeCoupons();

  const destinationCoupons =
    homeTrip && couponData?.coupons
      ? filterCouponsByDestination(couponData.coupons, {
          city: homeTrip.city,
          country: homeTrip.country,
        })
      : [];

  return (
    // 체크리스트가 있을 때만 FAB가 뜨므로, 그 자리를 비우는 여백도 그때만 준다.
    <AppShell
      withBottomNav
      mode={mode}
      className={homeTrip ? HOME_ADD_FAB_CLEARANCE_CLASSNAME : undefined}
    >
      <PageHeader
        brand
        title={appConfig.name}
        actions={<HeaderNavActions />}
        className="border-transparent"
      />

      <main>
        <h1 className="sr-only">홈</h1>
        {isLoading ? (
          <p className="py-12 text-center text-[14px] text-ink-2" role="status">
            여행을 불러오는 중…
          </p>
        ) : homeTrip ? (
          <div className="space-y-3">
            {/*
              여행을 바꾸는 건 홈 대문에서 한다 — 대문이 이미 "지금 어떤 여행인지"를 말하는
              자리이기 때문이다. 여행이 하나뿐이면 바꿀 게 없으므로 전환 UI를 아예 달지 않는다.
            */}
            <TripSwitchSheet
              trips={trips}
              activeTripId={homeTrip.id}
              today={today}
              onSelect={(tripId) => selectActiveTrip.mutateAsync(tripId)}
            >
              {(openTripSwitcher) => (
                <HomeUpcomingTripCard
                  trip={homeTrip}
                  progress={summary.purchaseProgress}
                  shoppingAmount={
                    mode === "after"
                      ? summary.purchasedTotal
                      : summary.estimatedTotal
                  }
                  today={today}
                  onChangeTrip={
                    trips.length > 1 ? openTripSwitcher : undefined
                  }
                />
              )}
            </TripSwitchSheet>

            {mode !== "after" ? (
              <HomeCouponBanner
                city={homeTrip.city}
                country={homeTrip.country}
                couponCount={destinationCoupons.length}
                loading={couponsLoading}
              />
            ) : null}

            <HomeShoppingTodo
              key={homeTrip.id}
              tripId={homeTrip.id}
              currency={homeTrip.currency}
              startDate={homeTrip.startDate}
              endDate={homeTrip.endDate}
              mode={checklistMode}
              today={today}
            />

            <HomeFxCard currency={homeTrip.currency} />
            <HomeAdBanner />
          </div>
        ) : (
          <div className="space-y-3">
            <HomeShoppingEmpty />
            <HomeAdBanner />
          </div>
        )}
      </main>
    </AppShell>
  );
}
