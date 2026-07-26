"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Plus } from "lucide-react";
import { toast } from "@/components/common/toast-alert";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { StorageUsageBanner } from "@/components/common/storage-usage-banner";
import { Button, buttonVariants } from "@/components/ui/button";
import { ItemCard } from "@/features/shopping-items/components/item-card";
import { ItemToolbar } from "@/features/shopping-items/components/item-toolbar";
import { ListSummary } from "@/features/shopping-items/components/list-summary";
import {
  useItems,
  useTogglePurchased,
} from "@/features/shopping-items/hooks/use-items";
import {
  filterItems,
  sortItems,
} from "@/features/shopping-items/utils/item-query";
import type {
  ItemPurchaseFilter,
  ItemSort,
} from "@/features/shopping-items/types";
import { calculateBudget } from "@/features/budget/utils/calculate-budget";
import { useTrip } from "@/features/trips/hooks/use-trips";
import { AddFromImagesSheet } from "@/features/image-upload/components/add-from-images-sheet";
import { formatTripStayWithPeriod } from "@/features/home/utils/trip-card-meta";
import { cn } from "@/lib/utils";

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const { data: trip, isLoading: tripLoading } = useTrip(tripId);
  const { data: items = [], isLoading: itemsLoading } = useItems(tripId);
  const togglePurchased = useTogglePurchased(tripId);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ItemPurchaseFilter>("all");
  const [sort, setSort] = useState<ItemSort>("createdAt_desc");
  const [uploadOpen, setUploadOpen] = useState(false);

  if (tripLoading) {
    return (
      <AppShell>
        <p className="py-16 text-center text-sm text-muted-foreground">
          불러오는 중…
        </p>
      </AppShell>
    );
  }

  if (!trip) {
    return (
      <AppShell>
        <EmptyState
          title="여행을 찾을 수 없어요"
          description="삭제되었거나 잘못된 링크일 수 있습니다."
          actionLabel="목록으로"
          onAction={() => router.push("/my-trips")}
        />
      </AppShell>
    );
  }

  const summary = calculateBudget(trip.budget, items);
  const visibleItems = sortItems(filterItems(items, filter, query), sort);

  return (
    <AppShell className="pb-28">
      <PageHeader title="쇼핑리스트" backHref="/my-trips" />

      <div className="flex flex-col gap-4">
        <StorageUsageBanner />
        <ListSummary
          summary={summary}
          currency={trip.currency}
          destinationLabel={`${trip.city}, ${trip.country}`}
          periodLabel={formatTripStayWithPeriod(trip.startDate, trip.endDate)}
          editHref={`/trips/${tripId}/edit`}
        />
        <ItemToolbar
          query={query}
          onQueryChange={setQuery}
          filter={filter}
          onFilterChange={setFilter}
          sort={sort}
          onSortChange={setSort}
        />

        {itemsLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            불러오는 중…
          </p>
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title={items.length === 0 ? "쇼핑리스트가 비어 있어요" : "결과가 없어요"}
            description={
              items.length === 0
                ? "사진으로 추가하거나 상품을 직접 등록해 보세요."
                : "검색어나 필터를 바꿔 보세요."
            }
            actionLabel={items.length === 0 ? "사진으로 추가" : undefined}
            onAction={
              items.length === 0 ? () => setUploadOpen(true) : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {visibleItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                currency={trip.currency}
                onToggle={() => {
                  togglePurchased.mutate(item.id, {
                    onError: () => toast.error("상태 변경에 실패했습니다"),
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-canvas/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Link
            href={`/trips/${tripId}/items/new`}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-auto shrink-0 px-3",
            )}
          >
            <Plus />
            직접입력
          </Link>
          <Button
            size="lg"
            className="min-w-0 flex-1"
            onClick={() => setUploadOpen(true)}
          >
            <Camera />
            사진으로 추가
          </Button>
        </div>
      </div>

      <AddFromImagesSheet
        tripId={tripId}
        city={trip.city}
        country={trip.country}
        currency={trip.currency}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />
    </AppShell>
  );
}
