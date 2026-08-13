"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { StorageUsageBanner } from "@/components/common/storage-usage-banner";
import { Button } from "@/components/ui/button";
import {
  TripCard,
  type TripCardStatus,
} from "@/features/trips/components/trip-card";
import { useTrips } from "@/features/trips/hooks/use-trips";
import { useItems } from "@/features/shopping-items/hooks/use-items";
import { calculateBudget } from "@/features/budget/utils/calculate-budget";
import { replaceWithDemoData } from "@/features/demo";
import { todayIsoDate } from "@/features/home/utils/get-upcoming-trip";
import { withReturnTo } from "@/lib/navigation/return-to";
import { createAccountScopedStorage } from "@/lib/storage/local-storage";
import { useHydrated } from "@/lib/react/use-hydrated";

function TripCardWithProgress({
  tripId,
  children,
}: {
  tripId: string;
  children: (progress?: number) => React.ReactNode;
}) {
  const { data: items = [] } = useItems(tripId);
  const summary = calculateBudget(0, items);
  return <>{children(items.length ? summary.purchaseProgress : undefined)}</>;
}

export default function MyTripsPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: trips = [], isLoading } = useTrips();
  const today = todayIsoDate();
  const tripSections: Array<{
    status: TripCardStatus;
    title: string;
    trips: typeof trips;
  }> = [
    {
      status: "live",
      title: "진행 중",
      trips: trips
        .filter(
          (trip) => trip.startDate <= today && trip.endDate >= today,
        )
        .sort((a, b) => a.endDate.localeCompare(b.endDate)),
    },
    {
      status: "prep",
      title: "예정",
      trips: trips
        .filter((trip) => trip.startDate > today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    },
    {
      status: "complete",
      title: "완료",
      trips: trips
        .filter((trip) => trip.endDate < today)
        .sort((a, b) => b.endDate.localeCompare(a.endDate)),
    },
  ];

  function handleSeedDemo() {
    const fixture = replaceWithDemoData(
      createAccountScopedStorage(window.localStorage),
    );
    const trip = fixture.trips.find(
      (candidate) => candidate.id === fixture.activeTripId,
    );
    if (!trip) return;
    void queryClient.invalidateQueries();
    router.push(withReturnTo(`/trips/${trip.id}`, "/my-trips"));
  }

  return (
    <AppShell withBottomNav>
      <PageHeader title="전체 여행 관리" backHref="/home" />

      <main className="flex flex-1 flex-col pb-20">
        <StorageUsageBanner className="mb-4" />

        {!hydrated || isLoading ? (
          <p
            className="py-10 text-center text-[13px] text-muted-foreground"
            role="status"
          >
            여행을 불러오는 중…
          </p>
        ) : trips.length === 0 ? (
          <EmptyState
            title="아직 여행이 없어요"
            description="첫 여행을 만들거나, 데모 데이터로 바로 체험해 보세요."
            actionLabel="여행 만들기"
            onAction={() =>
              router.push(withReturnTo("/trips/new", "/my-trips"))
            }
            secondaryLabel="데모 불러오기"
            onSecondary={handleSeedDemo}
          />
        ) : (
          <div className="flex flex-col gap-8">
            {tripSections.map((section) =>
              section.trips.length > 0 ? (
                <section
                  key={section.status}
                  aria-labelledby={`trip-section-${section.status}`}
                >
                  <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
                    <h2
                      id={`trip-section-${section.status}`}
                      className="text-[17px] font-semibold text-ink"
                    >
                      {section.title}
                    </h2>
                    <span className="text-[12px] font-medium text-ink-2">
                      {section.trips.length}개
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {section.trips.map((trip) => (
                      <TripCardWithProgress key={trip.id} tripId={trip.id}>
                        {(progress) => (
                          <TripCard trip={trip} progress={progress} />
                        )}
                      </TripCardWithProgress>
                    ))}
                  </div>
                </section>
              ) : null,
            )}
          </div>
        )}
      </main>

      {hydrated && !isLoading && trips.length > 0 ? (
        <div className="fixed right-[max(1rem,calc((100dvw-480px)/2+1rem))] bottom-[calc(var(--tab-bar-height)+1rem+env(safe-area-inset-bottom))] z-30">
          <Button
            size="icon-lg"
            aria-label="새 여행"
            className="size-14 rounded-full shadow-float [&_svg:not([class*='size-'])]:size-7"
            onClick={() =>
              router.push(withReturnTo("/trips/new", "/my-trips"))
            }
          >
            <Plus strokeWidth={2.5} />
          </Button>
        </div>
      ) : null}
    </AppShell>
  );
}
