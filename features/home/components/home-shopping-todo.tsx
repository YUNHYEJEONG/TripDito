"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyText } from "@/components/common/currency-text";
import { buttonVariants } from "@/components/ui/button";
import {
  itemKeys,
  useItems,
  useTogglePurchased,
} from "@/features/shopping-items/hooks/use-items";
import type { ShoppingItem } from "@/features/shopping-items/types";
import { lineTotal } from "@/features/budget/utils/calculate-budget";
import {
  getTripDayFilterOptions,
  getTripDayNumber,
} from "@/features/shopping-items/utils/trip-day";
import { useMouseDragScroll } from "@/features/shots/hooks/use-mouse-drag-scroll";
import { migrateShoppingListDemoFields } from "@/features/shopping-items/data/migrate-shopping-demo-fields";
import {
  GIFT_TAG_OPTIONS,
  type GiftTagId,
} from "@/features/shopping-items/constants/gift-tags";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 5;

export function HomeShoppingTodo({
  tripId,
  currency,
  startDate,
  endDate,
}: {
  tripId: string;
  currency: string;
  startDate: string;
  endDate: string;
}) {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useItems(tripId);
  const togglePurchased = useTogglePurchased(tripId);
  const [dayFilter, setDayFilter] = useState<number | "all">("all");
  const filterScrollerRef = useRef<HTMLDivElement>(null);

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
    if (dayFilter === "all") return items;
    return items.filter((item) => {
      const day = getTripDayNumber(
        startDate,
        endDate,
        item.plannedPurchaseDate,
      );
      return day === dayFilter;
    });
  }, [items, dayFilter, startDate, endDate]);

  const preview = filtered.slice(0, PREVIEW_LIMIT);
  const remaining = filtered.length - preview.length;

  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-background">
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <h2 className="flex items-baseline gap-1.5 text-[13px] font-semibold text-foreground">
          쇼핑리스트
          <span className="text-[12px] font-medium text-muted-foreground">
            {items.length}
          </span>
        </h2>
        <Link
          href={`/trips/${tripId}`}
          className="text-[12px] font-medium text-primary"
        >
          바로가기
        </Link>
      </div>

      <div className="px-4 pb-2">
        <div
          ref={filterScrollerRef}
          className={cn(
            "flex min-w-0 touch-pan-x items-center gap-1 overflow-x-auto overscroll-x-contain",
            "cursor-grab [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          <DayChip
            active={dayFilter === "all"}
            onClick={() => setDayFilter("all")}
          >
            전체
          </DayChip>
          {dayOptions.map((day) => (
            <DayChip
              key={day}
              active={dayFilter === day}
              onClick={() => setDayFilter(day)}
            >
              {day}일차
            </DayChip>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
          불러오는 중…
        </p>
      ) : preview.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-[13px] text-muted-foreground">
            {items.length === 0
              ? "쇼핑 리스트가 비어 있어요. 상품을 추가해 보세요."
              : "해당 일차에 예정된 쇼핑이 없어요."}
          </p>
          {items.length === 0 ? (
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
        <ul>
          {preview.map((item, index) => (
            <li key={item.id} className="px-4">
              {index > 0 ? (
                <div className="border-t border-border/80" aria-hidden />
              ) : null}
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
                    onError: () => toast.error("상태 변경에 실패했습니다"),
                  });
                }}
              />
            </li>
          ))}
          {remaining > 0 ? (
            <li className="px-4">
              <div className="border-t border-border/80" aria-hidden />
              <Link
                href={`/trips/${tripId}`}
                className="block py-2.5 text-center text-[12px] font-medium text-muted-foreground"
              >
                +{remaining}개 더 보기
              </Link>
            </li>
          ) : null}
        </ul>
      )}
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
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full border px-2.5 py-1 text-[13px] font-medium leading-none whitespace-nowrap transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-[#E5E8EB] bg-background text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function GiftTags({ tags }: { tags: GiftTagId[] }) {
  if (!tags.length) return null;
  return (
    <div className="mb-1 flex flex-wrap gap-1">
      {tags.map((id) => {
        const option = GIFT_TAG_OPTIONS.find((tag) => tag.id === id);
        if (!option) return null;
        return (
          <span
            key={id}
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-[#191F28]"
            style={{ backgroundColor: option.bg }}
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
  const dayNumber = getTripDayNumber(
    startDate,
    endDate,
    item.plannedPurchaseDate,
  );

  return (
    <div className="flex items-center gap-3 py-3">
      <Checkbox
        checked={item.purchased}
        disabled={toggling}
        onCheckedChange={() => onToggle()}
        aria-label="구매 완료"
        className="size-5 border border-border bg-background shadow-none data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground"
      />
      <Link
        href={`/trips/${item.tripId}/items/${item.id}/edit`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <div className="bg-muted flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          {item.imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageDataUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <Package className="size-4 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <GiftTags tags={giftTags} />
          <p
            className={cn(
              "block truncate text-[14px] font-medium text-foreground",
              item.purchased && "line-through text-muted-foreground",
            )}
          >
            {item.name}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
            <CurrencyText amount={lineTotal(item)} currency={currency} />
            {` · ${quantity}개`}
            {dayNumber != null ? ` · ${dayNumber}일차` : null}
          </p>
        </div>
      </Link>
      {item.purchased ? (
        <span className="shrink-0 self-center rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
          구매완료
        </span>
      ) : null}
    </div>
  );
}
