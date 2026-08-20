"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
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
import { replaceWithDemoData } from "@/features/demo/bootstrap";
import { todayIsoDate } from "@/features/home/utils/get-upcoming-trip";
import { withReturnTo } from "@/lib/navigation/return-to";
import { createAccountScopedStorage } from "@/lib/storage/local-storage";
import { useHydrated } from "@/lib/react/use-hydrated";

const passportReturnTo = "/passport";

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

export function PassportTripManager() {
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
    router.push(withReturnTo(`/trips/${trip.id}`, passportReturnTo));
  }

  return (
    <main aria-label="내 여행" className="flex flex-1 flex-col px-4 pt-4 pb-20">
      <StorageUsageBanner className="mb-6" />

      {!hydrated || isLoading ? (
        <p
          className="py-10 text-center text-[13px] leading-5 text-ink-2"
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
            router.push(withReturnTo("/trips/new", passportReturnTo))
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
                aria-labelledby={`passport-trip-section-${section.status}`}
                className="min-w-0"
              >
                <div className="mb-2 flex min-h-6 items-center justify-between gap-3 px-1">
                  <h2
                    id={`passport-trip-section-${section.status}`}
                    className="text-[16px] leading-6 font-semibold tracking-[-0.01em] text-ink"
                  >
                    {section.title}
                  </h2>
                  <span className="text-[13px] leading-5 font-medium text-ink-2 tabular-nums">
                    {section.trips.length}개
                  </span>
                </div>

                <div className="grid min-w-0 gap-2">
                  {section.trips.map((trip) => (
                    <TripCardWithProgress key={trip.id} tripId={trip.id}>
                      {(progress) => (
                        <TripCard
                          trip={trip}
                          progress={progress}
                          status={section.status}
                          returnTo={passportReturnTo}
                        />
                      )}
                    </TripCardWithProgress>
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </div>
      )}

      {hydrated && !isLoading && trips.length > 0 ? (
        <div className="fixed right-[max(1rem,calc((100dvw-480px)/2+1rem))] bottom-[calc(var(--tab-bar-height)+1rem+env(safe-area-inset-bottom))] z-30">
          <Button
            size="icon-lg"
            aria-label="새 여행"
            className="size-14 rounded-full shadow-float [&_svg:not([class*='size-'])]:size-7"
            onClick={() =>
              router.push(withReturnTo("/trips/new", passportReturnTo))
            }
          >
            <Plus strokeWidth={2.2} />
          </Button>
        </div>
      ) : null}
    </main>
  );
}
