"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { HeaderNavActions } from "@/components/layout/header-nav-actions";
import { HomeAdBanner } from "@/features/home/components/home-ad-banner";
import { HomeContextFab } from "@/features/home/components/home-context-fab";
import { HomeCouponBanner } from "@/features/home/components/home-coupon-banner";
import { HomeEverydayState } from "@/features/home/components/home-everyday-state";
import { HomeFxCard } from "@/features/home/components/home-fx-card";
import { HomeShoppingTodo } from "@/features/home/components/home-shopping-todo";
import { HomeStatusHero } from "@/features/home/components/home-status-hero";
import { HomeUpcomingTripCard } from "@/features/home/components/home-upcoming-trip-card";
import { TripSwitchSheet } from "@/features/home/components/trip-switch-sheet";
import {
  getTripHomeMode,
  resolveHomeTrip,
} from "@/features/home/utils/get-home-mode";
import { todayIsoDate } from "@/features/home/utils/get-upcoming-trip";
import { useTaxFreeCoupons } from "@/features/coupons/hooks/use-taxfree-coupons";
import { filterCouponsByDestination } from "@/features/coupons/lib/filter-coupons";
import { useFxRate } from "@/features/fx/hooks/use-fx-rate";
import { useItems } from "@/features/shopping-items/hooks/use-items";
import { useTrips } from "@/features/trips/hooks/use-trips";
import { calculateBudget } from "@/features/budget/utils/calculate-budget";
import { appConfig } from "@/config/app";
import {
  useActiveTripId,
  useSelectActiveTrip,
} from "@/features/home/hooks/use-active-trip";
import { useHydrated } from "@/lib/react/use-hydrated";

export default function HomePage() {
  const hydrated = useHydrated();
  const { data: selectedTripId = null } = useActiveTripId();
  const selectActiveTrip = useSelectActiveTrip();
  const { data: trips = [], isLoading: tripsLoading } = useTrips();
  const today = todayIsoDate();
  const activeTrip = resolveHomeTrip(trips, selectedTripId, today);
  const mode = activeTrip
    ? getTripHomeMode(activeTrip, today)
    : "idle";
  const isLoading = !hydrated || tripsLoading;
  const upcomingTrip =
    mode === "idle"
      ? activeTrip && activeTrip.startDate > today
        ? activeTrip
        : trips
            .filter(
              (trip) =>
                trip.startDate > today &&
                getTripHomeMode(trip, today) === "idle",
            )
            .sort(
              (a, b) =>
                a.startDate.localeCompare(b.startDate) ||
                a.createdAt.localeCompare(b.createdAt),
            )[0] ?? null
      : null;
  const planningTrip = activeTrip ?? upcomingTrip;
  const { data: items = [] } = useItems(planningTrip?.id ?? "");
  const summary = calculateBudget(planningTrip?.budget ?? 0, items);
  const { data: couponData } = useTaxFreeCoupons();
  const { data: fxRate } = useFxRate(
    mode === "after" ? activeTrip?.currency : undefined,
  );

  useEffect(() => {
    if (mode === "idle") delete document.body.dataset.mode;
    else document.body.dataset.mode = mode;

    return () => {
      delete document.body.dataset.mode;
    };
  }, [mode]);

  const destinationCoupons =
    planningTrip && couponData?.coupons
      ? filterCouponsByDestination(couponData.coupons, {
          city: planningTrip.city,
          country: planningTrip.country,
        })
      : [];

  const approximateKrw =
    mode === "after" && activeTrip
      ? activeTrip.currency === "KRW"
        ? summary.purchasedTotal
        : fxRate?.amountPer1000Krw
          ? (summary.purchasedTotal / fxRate.amountPer1000Krw) * 1000
          : undefined
      : undefined;

  const shoppingTodo =
    activeTrip && mode !== "idle" ? (
      <HomeShoppingTodo
        key={activeTrip.id}
        tripId={activeTrip.id}
        currency={activeTrip.currency}
        startDate={activeTrip.startDate}
        endDate={activeTrip.endDate}
        mode={mode}
        today={today}
      />
    ) : null;

  async function handleTripSelect(tripId: string) {
    await selectActiveTrip.mutateAsync(tripId);
  }

  return (
    <AppShell
      withBottomNav
      mode={mode}
      className="relative pb-[calc(var(--tab-bar-height)+6rem+env(safe-area-inset-bottom))]"
    >
      <PageHeader
        brand
        title={appConfig.name}
        actions={<HeaderNavActions />}
        className="border-transparent bg-mode-canvas"
      />

      <main>
        <h1 className="sr-only">홈</h1>
        {isLoading ? (
          <p className="py-12 text-center text-[14px] text-ink-2" role="status">
            여행을 불러오는 중…
          </p>
        ) : activeTrip && mode !== "idle" ? (
          <div className="space-y-4">
            <HomeUpcomingTripCard
              trip={activeTrip}
              progress={items.length ? summary.purchaseProgress : undefined}
              requiredBudget={summary.estimatedTotal}
            />
            <TripSwitchSheet
              trips={trips}
              activeTripId={activeTrip.id}
              today={today}
              onSelect={handleTripSelect}
            >
              {(openTripSwitcher) => (
                <HomeStatusHero
                  trip={activeTrip}
                  mode={mode}
                  summary={summary}
                  items={items}
                  approximateKrw={approximateKrw}
                  onSwitchTrip={openTripSwitcher}
                  today={today}
                />
              )}
            </TripSwitchSheet>

            {mode === "live" ? shoppingTodo : null}

            <div className="grid gap-3" aria-label="여행 도움 정보">
              <HomeCouponBanner
                city={activeTrip.city}
                country={activeTrip.country}
                couponCount={destinationCoupons.length}
                source={couponData?.source ?? "fallback"}
              />
              <HomeFxCard currency={activeTrip.currency} />
            </div>

            {mode !== "live" ? shoppingTodo : null}

            <HomeAdBanner />
          </div>
        ) : (
          <TripSwitchSheet
            trips={trips}
            activeTripId={activeTrip?.id ?? upcomingTrip?.id ?? selectedTripId}
            today={today}
            onSelect={handleTripSelect}
          >
            {(openTripSwitcher) => (
              <div className="space-y-5">
                {upcomingTrip ? (
                  <HomeUpcomingTripCard
                    trip={upcomingTrip}
                    progress={
                      items.length ? summary.purchaseProgress : undefined
                    }
                    requiredBudget={summary.estimatedTotal}
                  />
                ) : null}
                <HomeEverydayState
                  upcomingTrip={upcomingTrip}
                  onSwitchTrip={trips.length > 0 ? openTripSwitcher : undefined}
                >
                  {upcomingTrip ? (
                    <section aria-labelledby="early-planning-title" className="space-y-3">
                      <div>
                        <h2 id="early-planning-title" className="text-[18px] font-semibold text-ink">
                          {upcomingTrip.city} 미리 준비하기
                        </h2>
                        <p className="mt-1 text-[13px] leading-5 text-ink-2">
                          쇼핑리스트·쿠폰·환율을 지금부터 확인할 수 있어요.
                        </p>
                      </div>
                      <HomeShoppingTodo
                        tripId={upcomingTrip.id}
                        currency={upcomingTrip.currency}
                        startDate={upcomingTrip.startDate}
                        endDate={upcomingTrip.endDate}
                        mode="prep"
                      />
                      <div className="grid gap-3" aria-label="미리 보는 여행 도움 정보">
                        <HomeCouponBanner
                          city={upcomingTrip.city}
                          country={upcomingTrip.country}
                          couponCount={destinationCoupons.length}
                          source={couponData?.source ?? "fallback"}
                        />
                        <HomeFxCard currency={upcomingTrip.currency} />
                      </div>
                    </section>
                  ) : null}
                </HomeEverydayState>
                <HomeAdBanner />
              </div>
            )}
          </TripSwitchSheet>
        )}
      </main>

      {!isLoading ? (
        <HomeContextFab
          mode={mode}
          tripId={planningTrip?.id}
          currency={planningTrip?.currency}
        />
      ) : null}
    </AppShell>
  );
}
