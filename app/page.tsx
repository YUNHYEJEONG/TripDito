"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { StorageUsageBanner } from "@/components/common/storage-usage-banner";
import { Button, buttonVariants } from "@/components/ui/button";
import { TripCard } from "@/features/trips/components/trip-card";
import { tripKeys, useTrips } from "@/features/trips/hooks/use-trips";
import { itemKeys, useItems } from "@/features/shopping-items/hooks/use-items";
import { calculateBudget } from "@/features/budget/utils/calculate-budget";
import { seedDemoData } from "@/lib/storage/seed-demo";
import { cn } from "@/lib/utils";
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

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: trips = [], isLoading } = useTrips();

  function handleSeedDemo() {
    const { trip } = seedDemoData();
    void queryClient.invalidateQueries({ queryKey: tripKeys.all });
    void queryClient.invalidateQueries({ queryKey: itemKeys.all });
    toast.success("데모 여행을 불러왔습니다");
    router.push(`/trips/${trip.id}`);
  }

  return (
    <AppShell>
      <PageHeader
        title={appConfig.name}
        description="여행 쇼핑 리스트"
        actions={
          <Link
            href="/trips/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Plus />
            추가
          </Link>
        }
      />

      <StorageUsageBanner className="mb-4" />

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
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
        <div className="flex flex-col gap-2">
          {trips.map((trip) => (
            <TripCardWithProgress key={trip.id} tripId={trip.id}>
              {(progress) => <TripCard trip={trip} progress={progress} />}
            </TripCardWithProgress>
          ))}
        </div>
      )}

      <div className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 sm:right-[max(1rem,calc((100vw-48rem)/2+1rem))]">
        <Button
          size="lg"
          className="h-14 rounded-full px-5 shadow-lg"
          onClick={() => router.push("/trips/new")}
        >
          <Plus />
          새 여행
        </Button>
      </div>
    </AppShell>
  );
}
