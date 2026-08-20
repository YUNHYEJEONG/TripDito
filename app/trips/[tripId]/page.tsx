"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import {
  PageHeader,
  headerIconButtonClassName,
} from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ItemCard } from "@/features/shopping-items/components/item-card";
import { ItemToolbar } from "@/features/shopping-items/components/item-toolbar";
import {
  useDeleteItem,
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
import { getTripHomeMode } from "@/features/home/utils/get-home-mode";
import { readPassportStampPageAssignments } from "@/features/profile/utils/passport-stamp-flow";
import { getPassportStampIntentHref } from "@/features/profile/utils/passport-view";
import { SettlementProductGrid } from "@/features/trips/components/trip-settlement";
import { TripDetailActions } from "@/features/trips/components/trip-detail-actions";
import {
  TripStatusOverview,
  TripStatusOverviewLoading,
  TripStatusBadge,
} from "@/features/trips/components/trip-status-overview";
import {
  getNextSuitcaseCelebrationNonce,
  shouldCelebrateSuitcaseCompletion,
} from "@/features/trips/utils/trip-status-overview";
import { useTrip, useUpdateTripBudget } from "@/features/trips/hooks/use-trips";
import { AddFromImagesSheet } from "@/features/image-upload/components/add-from-images-sheet";
import { formatDateRange } from "@/lib/format/date";
import { getSafeReturnTo, withReturnTo } from "@/lib/navigation/return-to";
import { useHydrated } from "@/lib/react/use-hydrated";

const SUITCASE_CELEBRATION_WINDOW_MS = 760;

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
  const deleteItem = useDeleteItem(tripId);
  const updateBudget = useUpdateTripBudget(tripId);

  const [query, setQuery] = useState("");
  const [filterOverride, setFilterOverride] =
    useState<ItemPurchaseFilter | null>(null);
  const [sort, setSort] = useState<ItemSort>("createdAt_desc");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [revealedDelete, setRevealedDelete] = useState<{
    tripId: string;
    itemId: string;
  } | null>(null);
  const itemsRegionRef = useRef<HTMLElement>(null);
  const deleteFocusTargetRef = useRef<{
    tripId: string;
    deletedItemId: string;
    nextItemId?: string;
    previousItemId?: string;
  } | null>(null);
  const purchaseToggleInFlightRef = useRef(false);
  const suitcaseCelebrationSequenceRef = useRef(0);
  const suitcaseCelebrationTimerRef = useRef<number | null>(null);
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));
  const hydrated = useHydrated();
  const alreadyStamped =
    hydrated && Boolean(readPassportStampPageAssignments()[tripId]);
  const [suitcaseCelebration, setSuitcaseCelebration] = useState({
    tripId,
    nonce: 0,
  });

  useEffect(() => {
    deleteFocusTargetRef.current = null;
    itemsRegionRef.current?.scrollTo({ top: 0 });
  }, [tripId]);

  useEffect(() => {
    const pending = deleteFocusTargetRef.current;
    if (
      !pending ||
      pending.tripId !== tripId ||
      items.some((item) => item.id === pending.deletedItemId)
    ) {
      return;
    }

    const links =
      itemsRegionRef.current?.querySelectorAll<HTMLAnchorElement>(
        "[data-shopping-item-link]",
      ) ?? [];
    let target: HTMLAnchorElement | undefined;
    for (const targetId of [pending.nextItemId, pending.previousItemId]) {
      if (!targetId) continue;
      target = Array.from(links).find(
        (link) => link.dataset.shoppingItemLink === targetId,
      );
      if (target) break;
    }

    deleteFocusTargetRef.current = null;
    (target ?? itemsRegionRef.current)?.focus();
  }, [items, tripId]);

  useEffect(
    () => () => {
      if (suitcaseCelebrationTimerRef.current !== null) {
        window.clearTimeout(suitcaseCelebrationTimerRef.current);
        suitcaseCelebrationTimerRef.current = null;
      }
    },
    [],
  );

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
          onAction={() => router.push("/passport")}
        />
      </AppShell>
    );
  }

  const summary = calculateBudget(trip.budget, items);
  const mode = getTripHomeMode(trip);
  const isCompletedTrip = mode === "after";
  const swipeDeleteEnabled = mode === "idle" || mode === "prep";
  const revealedDeleteItemId =
    revealedDelete?.tripId === tripId ? revealedDelete.itemId : null;
  const tripHref = withReturnTo(`/trips/${tripId}`, returnTo);
  const passportHref = getPassportStampIntentHref(tripId, tripHref);
  const filter: ItemPurchaseFilter =
    mode === "live" || mode === "after"
      ? (filterOverride ?? "all")
      : "all";
  const visibleItems = sortItems(filterItems(items, filter, query), sort);

  function toggleItemPurchased(itemId: string) {
    if (purchaseToggleInFlightRef.current) return;

    const currentItem = items.find((item) => item.id === itemId);
    if (!currentItem) return;

    const purchasedCountBefore = items.reduce(
      (count, item) => count + (item.purchased ? 1 : 0),
      0,
    );
    if (currentItem.purchased) {
      if (suitcaseCelebrationTimerRef.current !== null) {
        window.clearTimeout(suitcaseCelebrationTimerRef.current);
        suitcaseCelebrationTimerRef.current = null;
      }
      setSuitcaseCelebration((current) =>
        current.tripId === tripId && current.nonce > 0
          ? { ...current, nonce: 0 }
          : current,
      );
    }

    purchaseToggleInFlightRef.current = true;

    togglePurchased.mutate(itemId, {
      onSuccess: (updatedItem) => {
        if (
          (mode !== "live" && mode !== "after") ||
          updatedItem.id !== currentItem.id
        ) {
          return;
        }

        const purchasedCountAfter =
          purchasedCountBefore -
          (currentItem.purchased ? 1 : 0) +
          (updatedItem.purchased ? 1 : 0);
        if (
          !shouldCelebrateSuitcaseCompletion({
            mutationSucceeded: true,
            totalCountBefore: items.length,
            purchasedCountBefore,
            totalCountAfter: items.length,
            purchasedCountAfter,
            itemPurchasedBefore: currentItem.purchased,
            itemPurchasedAfter: updatedItem.purchased,
          })
        ) {
          return;
        }

        if (suitcaseCelebrationTimerRef.current !== null) {
          window.clearTimeout(suitcaseCelebrationTimerRef.current);
        }
        const nextNonce = getNextSuitcaseCelebrationNonce(
          suitcaseCelebrationSequenceRef.current,
        );
        suitcaseCelebrationSequenceRef.current = nextNonce;
        setSuitcaseCelebration({
          tripId,
          nonce: nextNonce,
        });
        const resetDelay = window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches
          ? 0
          : SUITCASE_CELEBRATION_WINDOW_MS;
        suitcaseCelebrationTimerRef.current = window.setTimeout(() => {
          setSuitcaseCelebration((current) =>
            current.tripId === tripId && current.nonce === nextNonce
              ? { ...current, nonce: 0 }
              : current,
          );
          suitcaseCelebrationTimerRef.current = null;
        }, resetDelay);
      },
      onError: () => toast.error("상태를 바꾸지 못했어요. 다시 시도해 주세요."),
      onSettled: () => {
        purchaseToggleInFlightRef.current = false;
      },
    });
  }

  function deletePlannedItem(itemId: string) {
    if (!swipeDeleteEnabled || deleteItem.isPending) return;

    const deletedIndex = visibleItems.findIndex((item) => item.id === itemId);
    if (deletedIndex < 0) return;

    deleteFocusTargetRef.current = {
      tripId,
      deletedItemId: itemId,
      nextItemId: visibleItems[deletedIndex + 1]?.id,
      previousItemId: visibleItems[deletedIndex - 1]?.id,
    };

    deleteItem.mutate(itemId, {
      onSuccess: () => {
        setRevealedDelete((current) =>
          current?.tripId === tripId && current.itemId === itemId
            ? null
            : current,
        );
      },
      onError: () => {
        if (deleteFocusTargetRef.current?.deletedItemId === itemId) {
          deleteFocusTargetRef.current = null;
        }
        toast.error("상품을 삭제하지 못했어요. 다시 시도해 주세요.");
      },
    });
  }

  function resetItemsScroll() {
    itemsRegionRef.current?.scrollTo({ top: 0 });
  }

  function changeQuery(nextQuery: string) {
    resetItemsScroll();
    setRevealedDelete(null);
    setQuery(nextQuery);
  }

  function changeFilter(nextFilter: ItemPurchaseFilter) {
    resetItemsScroll();
    setRevealedDelete(null);
    setFilterOverride(nextFilter);
  }

  function changeSort(nextSort: ItemSort) {
    resetItemsScroll();
    setRevealedDelete(null);
    setSort(nextSort);
  }

  return (
    <AppShell
      surface="planning"
      className="h-dvh min-h-0 flex-none overflow-hidden bg-paper pb-0"
    >
      <PageHeader
        title={trip.name}
        titleAccessory={<TripStatusBadge mode={mode} />}
        description={`${trip.city}, ${trip.country} · ${formatDateRange(trip.startDate, trip.endDate)}`}
        backHref={returnTo}
        sticky={false}
        className="shrink-0"
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

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 space-y-2">
          {itemsLoading ? (
            <TripStatusOverviewLoading mode={mode} />
          ) : (
            <TripStatusOverview
              mode={mode}
              summary={summary}
              currency={trip.currency}
              budgetMode={trip.budgetMode}
              giftItemCount={
                items.filter((item) => item.giftTags.length > 0).length
              }
              onSaveBudget={async (next) => {
                await updateBudget.mutateAsync(next);
              }}
              budgetSavePending={updateBudget.isPending}
              budgetSaveError={
                updateBudget.error instanceof Error
                  ? updateBudget.error.message
                  : null
              }
              hasPriceReview={items.some(
                (item) => item.purchased && item.priceNeedsReview,
              )}
              suitcaseCelebrationNonce={
                suitcaseCelebration.tripId === tripId
                  ? suitcaseCelebration.nonce
                  : 0
              }
            />
          )}

          <ItemToolbar
            mode={mode}
            query={query}
            onQueryChange={changeQuery}
            filter={filter}
            onFilterChange={changeFilter}
            sort={sort}
            onSortChange={changeSort}
          />
        </div>

        <section
          ref={itemsRegionRef}
          tabIndex={0}
          aria-labelledby="trip-shopping-items-title"
          aria-busy={itemsLoading || undefined}
          className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
        >
          <h2 id="trip-shopping-items-title" className="sr-only">
            {trip.name} 쇼핑 상품
          </h2>

          {itemsLoading ? (
            <p
              role="status"
              className="py-10 text-center text-sm text-muted-foreground"
            >
              불러오는 중…
            </p>
          ) : visibleItems.length === 0 ? (
            <EmptyState
              title={
                items.length === 0
                  ? isCompletedTrip
                    ? "구매 기록이 비어 있어요"
                    : "쇼핑 리스트가 비어 있어요"
                  : filter === "purchased"
                    ? "구매 완료 기록이 없어요"
                    : "결과가 없어요"
              }
              description={
                items.length === 0
                  ? isCompletedTrip
                    ? "하단 + 버튼에서 구매 내역을 추가할 수 있어요."
                    : "사진으로 추가하거나 상품을 직접 등록해 보세요."
                  : "검색어나 필터를 바꿔 보세요."
              }
              actionLabel={undefined}
              onAction={undefined}
            />
          ) : isCompletedTrip ? (
            <SettlementProductGrid
              items={visibleItems}
              currency={trip.currency}
              startDate={trip.startDate}
              endDate={trip.endDate}
              returnTo={returnTo}
              togglingItemId={
                togglePurchased.isPending
                  ? togglePurchased.variables
                  : undefined
              }
              onTogglePurchased={toggleItemPurchased}
            />
          ) : (
            <div className="grid grid-cols-1 gap-y-2">
              {visibleItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  currency={trip.currency}
                  startDate={trip.startDate}
                  endDate={trip.endDate}
                  returnTo={returnTo}
                  showFavorite={isCompletedTrip}
                  mode={mode}
                  toggling={
                    togglePurchased.isPending &&
                    togglePurchased.variables === item.id
                  }
                  onToggle={() => toggleItemPurchased(item.id)}
                  deleteRevealed={
                    swipeDeleteEnabled && revealedDeleteItemId === item.id
                  }
                  deleting={
                    deleteItem.isPending && deleteItem.variables === item.id
                  }
                  onRevealDelete={
                    swipeDeleteEnabled
                      ? () => setRevealedDelete({ tripId, itemId: item.id })
                      : undefined
                  }
                  onCloseDelete={
                    swipeDeleteEnabled
                      ? () =>
                          setRevealedDelete((current) =>
                            current?.tripId === tripId &&
                            current.itemId === item.id
                              ? null
                              : current,
                          )
                      : undefined
                  }
                  onDelete={
                    swipeDeleteEnabled
                      ? () => deletePlannedItem(item.id)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <TripDetailActions
        tripId={tripId}
        completed={isCompletedTrip}
        returnTo={returnTo}
        passportHref={passportHref}
        stamped={alreadyStamped}
        onOpenPhoto={() => setUploadOpen(true)}
      />

      <AddFromImagesSheet
        tripId={tripId}
        currency={trip.currency}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        intent={
          isCompletedTrip
            ? {
                kind: "trip-purchases",
                purchasedOn: trip.endDate,
                context: "settlement",
              }
            : undefined
        }
      />
    </AppShell>
  );
}
