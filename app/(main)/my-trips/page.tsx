"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "@/components/common/toast-alert";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { HeaderNavActions } from "@/components/layout/header-nav-actions";
import { EmptyState } from "@/components/common/empty-state";
import { StorageUsageBanner } from "@/components/common/storage-usage-banner";
import { Button } from "@/components/ui/button";
import { GrayCard } from "@/components/ui/gray-card";
import { TripCard } from "@/features/trips/components/trip-card";
import { tripKeys, useTrips } from "@/features/trips/hooks/use-trips";
import { itemKeys, useItems } from "@/features/shopping-items/hooks/use-items";
import { shotKeys } from "@/features/shots/hooks/use-shots";
import { scrapKeys } from "@/features/shots/hooks/use-scraps";
import { profileKeys } from "@/features/profile/hooks/use-local-profile";
import { calculateBudget } from "@/features/budget/utils/calculate-budget";
import {
  getTripPhase,
  todayIsoDate,
} from "@/features/home/utils/get-upcoming-trip";
import { seedDemoData } from "@/lib/storage/seed-demo";
import { appConfig } from "@/config/app";
import type { Trip } from "@/features/trips/types";

function TripCardWithBudget({ trip }: { trip: Trip }) {
  const { data: items = [] } = useItems(trip.id);
  const summary = calculateBudget(trip.budget, items);
  return (
    <TripCard
      trip={trip}
      estimatedTotal={summary.estimatedTotal}
      progress={summary.purchaseProgress}
    />
  );
}

export default function MyTripsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: trips = [], isLoading } = useTrips();

  const { ongoingTrips, otherTrips } = useMemo(() => {
    const today = todayIsoDate();
    const ongoing: Trip[] = [];
    const other: Trip[] = [];
    for (const trip of trips) {
      if (getTripPhase(trip, today) === "ongoing") {
        ongoing.push(trip);
      } else {
        other.push(trip);
      }
    }
    return { ongoingTrips: ongoing, otherTrips: other };
  }, [trips]);

  function handleSeedDemo() {
    const { trip } = seedDemoData();
    void queryClient.invalidateQueries({ queryKey: tripKeys.all });
    void queryClient.invalidateQueries({ queryKey: itemKeys.all });
    void queryClient.invalidateQueries({ queryKey: shotKeys.all });
    void queryClient.invalidateQueries({ queryKey: scrapKeys.all });
    void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    toast.success("데모 여행을 불러왔습니다.");
    router.push(`/trips/${trip.id}`);
  }

  return (
    <AppShell withBottomNav>
      <PageHeader title="내 여행" actions={<HeaderNavActions />} />

      <GrayCard className="mb-4" size="sm">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={appConfig.brand.symbolSrc}
              alt=""
              className="size-8 object-contain"
            />
          </div>
          <p className="min-w-0 text-[14px] font-bold leading-snug text-foreground">
            오늘부터 트립디토 😏
            <br />
            사진만 찍으면 쇼핑리스트 완성! ✨
          </p>
        </div>
      </GrayCard>

      <StorageUsageBanner className="mb-4" />

      {isLoading ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          불러오는 중…
        </p>
      ) : trips.length === 0 ? (
        <EmptyState
          title="아직 여행이 없어요"
          description="첫 여행을 만들거나, 데모 데이터로 바로 체험해 보세요."
          actionLabel="여행 만들기"
          onAction={() => router.push("/trips/new")}
          secondaryLabel="데모 불러오기"
          onSecondary={handleSeedDemo}
        />
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-baseline gap-1.5 text-[16px] font-bold tracking-tight text-foreground">
            쇼핑리스트
            <span className="text-[13px] font-medium text-muted-foreground">
              {trips.length}
            </span>
          </h2>

          <div className="flex flex-col gap-3">
            {ongoingTrips.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {ongoingTrips.map((trip) => (
                  <TripCardWithBudget key={trip.id} trip={trip} />
                ))}
              </div>
            ) : null}

            {ongoingTrips.length > 0 && otherTrips.length > 0 ? (
              <div className="border-t border-border" role="separator" />
            ) : null}

            {otherTrips.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {otherTrips.map((trip) => (
                  <TripCardWithBudget key={trip.id} trip={trip} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      )}

      <div className="fixed right-4 bottom-[calc(3.5rem+1rem+env(safe-area-inset-bottom))] z-30 md:right-[max(1rem,calc((100vw-720px)/2+1rem))] lg:right-[max(1rem,calc((100vw-960px)/2+1rem))]">
        <Button
          size="icon-lg"
          aria-label="새 여행"
          className="size-14 rounded-full shadow-md [&_svg:not([class*='size-'])]:size-7"
          onClick={() => router.push("/trips/new")}
        >
          <Plus strokeWidth={2.5} />
        </Button>
      </div>
    </AppShell>
  );
}
