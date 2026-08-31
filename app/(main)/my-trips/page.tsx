"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, ChevronRight, Plus, Stamp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { HeaderNavActions } from "@/components/layout/header-nav-actions";
import { EmptyState } from "@/components/common/empty-state";
import {
  CardListSkeleton,
  LoadingRegion,
} from "@/components/common/loading-skeletons";
import { Button } from "@/components/ui/button";
import {
  GrayCard,
  GrayCardDescription,
  GrayCardTitle,
} from "@/components/ui/gray-card";
import { TripCard } from "@/features/trips/components/trip-card";
import { useTrips } from "@/features/trips/hooks/use-trips";
import { useItems } from "@/features/shopping-items/hooks/use-items";
import { calculateBudget } from "@/features/budget/utils/calculate-budget";
import { getCompletedPassportTrips } from "@/features/profile/utils/passport-trips";
import { appConfig } from "@/config/app";

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
  const router = useRouter();
  const { data: trips = [], isLoading } = useTrips();
  const completedTripCount = getCompletedPassportTrips(trips).length;

  return (
    <AppShell withBottomNav>
      <PageHeader title="내여행" actions={<HeaderNavActions />} />

      <GrayCard className="mb-4" size="sm">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background">
            <Camera className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <GrayCardTitle className="text-[14px]">
              사진으로 쇼핑 리스트 만들기
            </GrayCardTitle>
            <GrayCardDescription className="mt-0.5">
              {appConfig.tagline}. 여행 중 산 물건을 찍어 바로 체크하세요.
            </GrayCardDescription>
          </div>
        </div>
      </GrayCard>

      {/* 나의 여권 — 다녀온 여행을 입국 도장으로 모아 보기 */}
      <Link
        href="/passport"
        className="mb-4 flex items-center gap-2.5 rounded-xl bg-[var(--passport-cover)] px-3.5 py-3 transition-opacity active:opacity-90"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
          <Stamp className="size-4 text-[var(--passport-foil)]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-white">
            나의 여권
          </span>
          <span className="mt-0.5 block text-[12px] text-white/70">
            {completedTripCount > 0
              ? `완료한 여행 ${completedTripCount}개, 입국 도장으로 모았어요`
              : "여행을 완료하면 입국 도장이 찍혀요"}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-white/60" />
      </Link>

      {isLoading ? (
        <LoadingRegion>
          <CardListSkeleton />
        </LoadingRegion>
      ) : trips.length === 0 ? (
        <EmptyState
          title="아직 여행이 없어요"
          description="첫 여행을 만들고 쇼핑 리스트를 채워 보세요."
          actionLabel="여행 만들기"
          onAction={() => router.push("/trips/new")}
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {trips.map((trip) => (
            <TripCardWithProgress key={trip.id} tripId={trip.id}>
              {(progress) => <TripCard trip={trip} progress={progress} />}
            </TripCardWithProgress>
          ))}
        </div>
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
