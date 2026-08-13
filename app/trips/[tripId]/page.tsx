"use client";

import { use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Camera, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import {
  PageHeader,
  headerIconButtonClassName,
} from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
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
import { formatDateRange } from "@/lib/format/date";
import { getSafeReturnTo, withReturnTo } from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: trip, isLoading: tripLoading } = useTrip(tripId);
  const { data: items = [], isLoading: itemsLoading } = useItems(tripId);
  const togglePurchased = useTogglePurchased(tripId);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ItemPurchaseFilter>("all");
  const [sort, setSort] = useState<ItemSort>("createdAt_desc");
  const [uploadOpen, setUploadOpen] = useState(false);
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));

  if (tripLoading) {
    return (
      <AppShell surface="planning">
        <p className="py-16 text-center text-sm text-muted-foreground">
          불러오는 중…
        </p>
      </AppShell>
    );
  }

  if (!trip) {
    return (
      <AppShell surface="planning">
        <EmptyState
          title="여행을 찾을 수 없어요"
          description="삭제되었거나 잘못된 링크일 수 있어요."
          actionLabel="목록으로"
          onAction={() => router.push("/my-trips")}
        />
      </AppShell>
    );
  }

  const summary = calculateBudget(trip.budget, items);
  const visibleItems = sortItems(filterItems(items, filter, query), sort);
  const isCompletedTrip = trip.endDate < new Date().toISOString().slice(0, 10);

  return (
    <AppShell
      surface="planning"
      className="pb-[calc(6rem+env(safe-area-inset-bottom))]"
    >
      <PageHeader
        title={trip.name}
        description={`${trip.city}, ${trip.country} · ${formatDateRange(trip.startDate, trip.endDate)}`}
        backHref={returnTo}
        actions={
          <Link
            href={withReturnTo(`/trips/${tripId}/edit`, returnTo)}
            aria-label="여행 수정"
            className={headerIconButtonClassName}
          >
            <Pencil />
          </Link>
        }
      />

      <div className="flex flex-col gap-4">
        <ListSummary
          summary={summary}
          currency={trip.currency}
          budgetKnown={trip.budgetMode === "input"}
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
            title={items.length === 0 ? "쇼핑 리스트가 비어 있어요" : "결과가 없어요"}
            description={
              items.length === 0
                ? "사진으로 추가하거나 상품을 직접 등록해 보세요."
                : "검색어나 필터를 바꿔 보세요."
            }
            actionLabel={undefined}
            onAction={undefined}
          />
        ) : (
          <div className="grid grid-cols-1 gap-y-4">
            {visibleItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                currency={trip.currency}
                startDate={trip.startDate}
                endDate={trip.endDate}
                returnTo={returnTo}
                showFavorite={isCompletedTrip}
                toggling={
                  togglePurchased.isPending &&
                  togglePurchased.variables === item.id
                }
                onToggle={() => {
                  togglePurchased.mutate(item.id, {
                    onError: () =>
                      toast.error(
                        "상태를 바꾸지 못했어요. 다시 시도해 주세요.",
                      ),
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[var(--app-rail-max)] border-t border-rule bg-paper px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] min-[481px]:border-x">
        <div className="flex gap-2">
          <Link
            href={withReturnTo(`/trips/${tripId}/items/new`, returnTo)}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-w-0 flex-1 px-2",
            )}
          >
            <Plus />
            직접 추가
          </Link>
          <Button
            size="lg"
            className="min-w-0 flex-[1.25] px-2"
            onClick={() => setUploadOpen(true)}
          >
            <Camera />
            사진으로 추가
          </Button>
        </div>
      </div>

      <AddFromImagesSheet
        tripId={tripId}
        currency={trip.currency}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />
    </AppShell>
  );
}
