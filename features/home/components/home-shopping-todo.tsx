"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Check, ChevronDown, Package, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyText } from "@/components/common/currency-text";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  itemKeys,
  useItems,
  useTogglePurchased,
} from "@/features/shopping-items/hooks/use-items";
import type { ShoppingItem } from "@/features/shopping-items/types";
import { lineTotal } from "@/features/budget/utils/calculate-budget";
import {
  getTripDayFilterOptions,
  getTripDayNumbers,
  normalizePlannedPurchaseDates,
} from "@/features/shopping-items/utils/trip-day";
import { useMouseDragScroll } from "@/features/shots/hooks/use-mouse-drag-scroll";
import { migrateShoppingListDemoFields } from "@/features/shopping-items/data/migrate-shopping-demo-fields";
import {
  GIFT_TAG_OPTIONS,
  type GiftTagId,
} from "@/features/shopping-items/constants/gift-tags";
import type { HomeMode } from "@/features/home/utils/get-home-mode";
import {
  filterHomePurchaseItems,
  getHomeShoppingPreview,
  type HomePurchaseFilter,
} from "@/features/home/utils/home-shopping-list";
import { AddFromImagesSheet } from "@/features/image-upload/components/add-from-images-sheet";
import { todayIsoDate } from "@/features/home/utils/get-upcoming-trip";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 3;

export function HomeShoppingTodo({
  tripId,
  currency,
  startDate,
  endDate,
  mode,
  today = todayIsoDate(),
}: {
  tripId: string;
  currency: string;
  startDate: string;
  endDate: string;
  mode: Exclude<HomeMode, "idle">;
  today?: string;
}) {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useItems(tripId);
  const togglePurchased = useTogglePurchased(tripId);
  const [dayFilter, setDayFilter] = useState<number | "all">("all");
  const [purchaseFilter, setPurchaseFilter] =
    useState<HomePurchaseFilter>("all");
  const [expanded, setExpanded] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const filterScrollerRef = useRef<HTMLDivElement>(null);
  const listId = `home-shopping-list-${useId()}`;

  useMouseDragScroll(filterScrollerRef, true, { snap: false, wheel: true });

  useEffect(() => {
    const updated = migrateShoppingListDemoFields();
    if (updated) {
      void queryClient.invalidateQueries({ queryKey: itemKeys.all });
    }
  }, [queryClient]);

  const dayOptions = useMemo(
    () => getTripDayFilterOptions(startDate, endDate),
    [startDate, endDate],
  );

  const filtered = useMemo(() => {
    if (mode === "live") {
      return filterHomePurchaseItems(items, purchaseFilter);
    }
    if (dayFilter === "all") return items;
    return items.filter((item) => {
      const days = getTripDayNumbers(
        startDate,
        endDate,
        normalizePlannedPurchaseDates(item),
      );
      return days.includes(dayFilter);
    });
  }, [items, mode, purchaseFilter, dayFilter, startDate, endDate]);

  const preview = getHomeShoppingPreview(filtered, PREVIEW_LIMIT, expanded);
  const remaining = filtered.length - preview.length;
  const canTogglePreview = filtered.length > PREVIEW_LIMIT;
  const purchasedCount = items.filter((item) => item.purchased).length;

  return (
    <section
      id={`home-purchase-checklist-${tripId}`}
      tabIndex={-1}
      className="scroll-mt-20 overflow-hidden rounded-xl bg-paper outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <div className="flex min-h-14 items-center gap-2 px-4 pt-3 pb-2">
        <h2 className="flex items-baseline gap-2 text-[18px] font-semibold text-ink">
          {mode === "live"
            ? "구매 체크리스트"
            : mode === "after"
              ? "여행 쇼핑 기록"
              : "챙길 쇼핑"}
          <span className="text-[13px] font-medium text-ink-2">
            {mode === "live"
              ? `${purchasedCount}/${items.length} 완료`
              : items.length}
          </span>
        </h2>
      </div>

      {mode === "live" ? (
        <div className="space-y-3 px-4 pb-4">
          <p className="text-[13px] leading-5 text-ink-2">
            여행 전에 담아 둔 상품과 구매한 내역을 함께 확인하세요.
          </p>
          <div
            ref={filterScrollerRef}
            className="scrollbar-none flex min-w-0 items-center gap-2 overflow-x-auto"
            aria-label="구매 상태 필터"
          >
            <DayChip
              active={purchaseFilter === "all"}
              onClick={() => setPurchaseFilter("all")}
            >
              전체 {items.length}
            </DayChip>
            <DayChip
              active={purchaseFilter === "pending"}
              onClick={() => setPurchaseFilter("pending")}
            >
              살 것 {items.length - purchasedCount}
            </DayChip>
            <DayChip
              active={purchaseFilter === "purchased"}
              onClick={() => setPurchaseFilter("purchased")}
            >
              구매 완료 {purchasedCount}
            </DayChip>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/trips/${tripId}/items/new?returnTo=${encodeURIComponent("/home")}`}
              className={cn(
                buttonVariants({ variant: "surfaceOutline", size: "sm" }),
                "min-h-11 w-full",
              )}
            >
              <Plus aria-hidden />
              직접 추가
            </Link>
            <Button
              type="button"
              variant="surfaceOutline"
              size="sm"
              className="min-h-11 w-full"
              onClick={() => setUploadOpen(true)}
            >
              <Camera aria-hidden />
              사진으로 추가
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4">
          <div
            ref={filterScrollerRef}
            className={cn(
              "flex min-w-0 touch-auto items-center gap-2 overflow-x-auto overscroll-x-contain",
              "cursor-grab [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            )}
            aria-label="구매 예정 일차 필터"
          >
            <DayChip
              active={dayFilter === "all"}
              onClick={() => {
                if (!filterScrollerRef.current?.dataset.dragMoved) {
                  setDayFilter("all");
                }
              }}
            >
              전체
            </DayChip>
            {dayOptions.map((day) => (
              <DayChip
                key={day}
                active={dayFilter === day}
                onClick={() => {
                  if (!filterScrollerRef.current?.dataset.dragMoved) {
                    setDayFilter(day);
                  }
                }}
              >
                {day}일차
              </DayChip>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <p
          className="border-t border-rule/80 px-4 py-6 text-center text-[13px] text-ink-2"
          role="status"
        >
          불러오는 중…
        </p>
      ) : preview.length === 0 ? (
        <div className="border-t border-rule/80 px-4 py-6 text-center">
          <p className="text-[13px] text-ink-2">
            {items.length === 0
              ? mode === "live"
                ? "담아 둔 상품이 없어요. 직접 또는 사진으로 추가해 보세요."
                : "쇼핑 리스트가 비어 있어요. 상품을 추가해 보세요."
              : mode === "live"
                ? "이 상태에 해당하는 상품이 없어요."
                : "해당 일차에 예정된 쇼핑이 없어요."}
          </p>
          {items.length === 0 && mode !== "live" ? (
            <Link
              href={`/trips/${tripId}/items/new`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-3",
              )}
            >
              <Plus />
              상품 추가
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="border-t border-rule/80">
          <ul id={listId} className="divide-y divide-rule/80 px-4">
            {preview.map((item) => (
              <li key={item.id}>
                <ShoppingRow
                  item={item}
                  currency={currency}
                  startDate={startDate}
                  endDate={endDate}
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
              </li>
            ))}
          </ul>
          {canTogglePreview ? (
            <div className="border-t border-rule/80 px-4 py-2">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={listId}
                onClick={() => setExpanded((current) => !current)}
                className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-ink-2 outline-none transition-colors duration-120 hover:bg-paper-2 hover:text-ink active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
              >
                {expanded ? "접기" : `${remaining}개 더 보기`}
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-120 motion-reduce:transition-none",
                    expanded && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
            </div>
          ) : null}
        </div>
      )}

      {mode === "live" ? (
        <AddFromImagesSheet
          tripId={tripId}
          currency={currency}
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          intent={{ kind: "trip-purchases", purchasedOn: today }}
        />
      ) : null}
    </section>
  );
}

function DayChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border px-3 text-[13px] font-medium leading-none whitespace-nowrap outline-none transition-colors duration-120 focus-visible:ring-2 focus-visible:ring-focus",
        active
          ? "border-ink bg-ink text-paper hover:bg-ink-2 active:bg-ink-2"
          : "border-rule bg-paper text-ink-2 hover:border-control hover:bg-paper-2 active:bg-paper-3",
      )}
    >
      {children}
    </button>
  );
}

function GiftTags({ tags }: { tags: GiftTagId[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((id) => {
        const option = GIFT_TAG_OPTIONS.find((tag) => tag.id === id);
        if (!option) return null;
        return (
          <span
            key={id}
            className={cn(
              "rounded-xs px-2 py-1 text-[11px] font-semibold text-ink",
              id === "acquaintance" && "bg-gift-acq",
              id === "colleague" && "bg-gift-col",
              id === "friend" && "bg-gift-fri",
            )}
          >
            {option.label}
          </span>
        );
      })}
    </div>
  );
}

function ShoppingRow({
  item,
  currency,
  startDate,
  endDate,
  onToggle,
  toggling,
}: {
  item: ShoppingItem;
  currency: string;
  startDate: string;
  endDate: string;
  onToggle: () => void;
  toggling?: boolean;
}) {
  const quantity = item.quantity >= 1 ? item.quantity : 1;
  const giftTags = item.giftTags ?? [];
  const dayNumbers = getTripDayNumbers(
    startDate,
    endDate,
    normalizePlannedPurchaseDates(item),
  );

  return (
    <article className="grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)] items-stretch gap-2 py-3">
      <div className="flex min-h-14 items-center justify-center">
        <Checkbox
          checked={item.purchased}
          disabled={toggling}
          onCheckedChange={() => onToggle()}
          aria-label={`${item.name} 구매 완료`}
          className="size-5 border border-control bg-paper shadow-none after:-inset-3.5 data-checked:border-success-text data-checked:bg-success-text data-checked:text-paper"
        />
      </div>

      <Link
        href={`/trips/${item.tripId}/items/${item.id}/edit?returnTo=${encodeURIComponent("/home")}`}
        aria-label={`${item.name} 상품 수정`}
        className="grid min-h-14 min-w-0 grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 rounded-xl py-1 pr-1 outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus motion-reduce:transition-none"
      >
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-paper-2">
          {item.imageDataUrl ? (
            // User-created data URLs have no stable intrinsic dimensions.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageDataUrl}
              alt=""
              className={cn(
                "size-full object-cover",
                item.purchased && "opacity-60",
              )}
            />
          ) : (
            <Package
              className={cn(
                "size-5 text-ink-3",
                item.purchased && "opacity-60",
              )}
              aria-hidden
            />
          )}
        </div>

        <div className="min-w-0 space-y-1">
          <GiftTags tags={giftTags} />
          <div className="flex min-w-0 items-start gap-2">
            <p
              className={cn(
                "min-w-0 flex-1 truncate text-[15px] leading-5 font-semibold text-ink",
                item.purchased && "line-through text-ink-2",
              )}
            >
              {item.name}
            </p>
            {item.purchased ? (
              <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-success-text/10 px-1.5 text-[10px] font-semibold text-success-text">
                <Check className="size-3" strokeWidth={3} aria-hidden />
                완료
              </span>
            ) : null}
          </div>
          <p className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[12px] leading-4 text-ink-2">
            <span className="font-medium text-ink">
              <CurrencyText amount={lineTotal(item)} currency={currency} />
            </span>
            <span aria-hidden>·</span>
            <span>{quantity}개</span>
            <span aria-hidden>·</span>
            <span>
              {dayNumbers.length > 0
                ? dayNumbers.map((day) => `${day}일차`).join(" · ")
                : "일차 미정"}
            </span>
          </p>
        </div>
      </Link>
    </article>
  );
}
