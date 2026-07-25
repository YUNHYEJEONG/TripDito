"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { HeaderNavActions } from "@/components/layout/header-nav-actions";
import { EmptyState } from "@/components/common/empty-state";
import { StorageUsageBanner } from "@/components/common/storage-usage-banner";
import { Button } from "@/components/ui/button";
import {
  GrayCard,
  GrayCardDescription,
  GrayCardTitle,
} from "@/components/ui/gray-card";
import { TripCard } from "@/features/trips/components/trip-card";
import { tripKeys, useTrips } from "@/features/trips/hooks/use-trips";
import { itemKeys, useItems } from "@/features/shopping-items/hooks/use-items";
import { shotKeys } from "@/features/shots/hooks/use-shots";
import { scrapKeys } from "@/features/shots/hooks/use-scraps";
import { profileKeys } from "@/features/profile/hooks/use-local-profile";
import { calculateBudget } from "@/features/budget/utils/calculate-budget";
import { seedDemoData } from "@/lib/storage/seed-demo";
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
  const queryClient = useQueryClient();
  const { data: trips = [], isLoading } = useTrips();

  function handleSeedDemo() {
    const { trip } = seedDemoData();
    void queryClient.invalidateQueries({ queryKey: tripKeys.all });
    void queryClient.invalidateQueries({ queryKey: itemKeys.all });
    void queryClient.invalidateQueries({ queryKey: shotKeys.all });
    void queryClient.invalidateQueries({ queryKey: scrapKeys.all });
    void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    toast.success("데모 여행을 불러왔습니다");
    router.push(`/trips/${trip.id}`);
  }

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
