"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/common/toast-alert";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyText } from "@/components/common/currency-text";
import { Button } from "@/components/ui/button";
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
} from "@/features/shopping-items/utils/trip-day";
import { useMouseDragScroll } from "@/features/shots/hooks/use-mouse-drag-scroll";
import { migrateShoppingListDemoFields } from "@/features/shopping-items/data/migrate-shopping-demo-fields";
import { AddFromImagesSheet } from "@/features/image-upload/components/add-from-images-sheet";
import { ItemDetailSheet } from "@/features/shopping-items/components/item-detail-sheet";
import { ItemStatusTags } from "@/features/shopping-items/components/item-status-tags";
import { SeeMoreLink } from "@/components/common/see-more-control";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 5;

export function HomeShoppingTodo({
  tripId,
  city,
  country,
  currency,
  startDate,
  endDate,
}: {
  tripId: string;
  city: string;
  country: string;
  currency: string;
  startDate: string;
  endDate: string;
}) {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useItems(tripId);
  const togglePurchased = useTogglePurchased(tripId);
  const [dayFilter, setDayFilter] = useState<number | "all">("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ShoppingItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const filterScrollerRef = useRef<HTMLDivElement>(null);

  useMouseDragScroll(filterScrollerRef, true, { snap: false, wheel: true });

  useEffect(() => {
    const updated = migrateShoppingListDemoFields();
    if (updated) {
      void queryClient.invalidateQueries({ queryKey: itemKeys.all });
    }
  }, [queryClient]);

  useEffect(() => {
    if (!detailItem) return;
    const next = items.find((entry) => entry.id === detailItem.id);
    if (next && next.updatedAt !== detailItem.updatedAt) {
      setDetailItem(next);
    }
  }, [items, detailItem]);

  const dayOptions = useMemo(
    () => getTripDayFilterOptions(startDate, endDate),
    [startDate, endDate],
  );

  const filtered = useMemo(() => {
    if (dayFilter === "all") return items;
    return items.filter((item) => {
      const days = getTripDayNumbers(
        startDate,
        endDate,
        item.plannedPurchaseDates,
      );
      return days.includes(dayFilter);
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
              ? "쇼핑리스트가 비어 있어요. 상품을 추가해 보세요."
              : "해당 일차에 예정된 쇼핑이 없어요."}
          </p>
          {items.length === 0 ? (
            <Button
              type="button"
              size="sm"
              className="mt-3"
              onClick={() => setUploadOpen(true)}
            >
              <Plus />
              사진으로 추가
            </Button>
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
                toggling={
                  togglePurchased.isPending &&
                  togglePurchased.variables === item.id
                }
                onSelect={() => {
                  setDetailItem(item);
                  setDetailOpen(true);
                }}
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
              <SeeMoreLink href={`/trips/${tripId}`}>
                +{remaining}개 더보기
              </SeeMoreLink>
            </li>
          ) : null}
        </ul>
      )}

      <AddFromImagesSheet
        tripId={tripId}
        city={city}
        country={country}
        currency={currency}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />

      <ItemDetailSheet
        item={detailItem}
        currency={currency}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* 사진으로 추가 FAB */}
      <button
        type="button"
        aria-label="사진으로 추가"
        onClick={() => setUploadOpen(true)}
        className={cn(
          "fixed right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md",
          "bottom-[calc(3.5rem+1rem+env(safe-area-inset-bottom))]",
          "md:right-[max(1rem,calc((100vw-720px)/2+1rem))]",
          "lg:right-[max(1rem,calc((100vw-960px)/2+1rem))]",
          "transition-transform active:scale-95",
        )}
      >
        <CameraPlusIcon className="size-7" />
      </button>
    </section>
  );
}

/** 카메라 본체 + 렌즈 대신 + */
function CameraPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <path d="M12 10.5v5" />
      <path d="M9.5 13h5" />
    </svg>
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

function ShoppingRow({
  item,
  currency,
  onToggle,
  onSelect,
  toggling,
}: {
  item: ShoppingItem;
  currency: string;
  onToggle: () => void;
  onSelect: () => void;
  toggling?: boolean;
}) {
  const quantity = item.quantity >= 1 ? item.quantity : 1;

  return (
    <div className="flex items-start gap-3 py-3">
      <Checkbox
        checked={item.purchased}
        disabled={toggling}
        onCheckedChange={() => onToggle()}
        aria-label="구매 완료"
        className="mt-0.5 size-5"
      />
      <button
        type="button"
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
        onClick={onSelect}
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
        <div className="min-w-0 flex-1">
          <ItemStatusTags
            purchased={item.purchased}
            giftTags={item.giftTags ?? []}
          />
          <p
            className={cn(
              "break-words text-[14px] font-medium leading-snug text-foreground",
              item.purchased && "line-through text-muted-foreground",
            )}
          >
            {item.name}
          </p>
          {item.localName?.trim() ? (
            <p className="mt-0.5 break-words text-[10px] leading-snug text-muted-foreground">
              {item.localName.trim()}
            </p>
          ) : null}
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            <CurrencyText amount={lineTotal(item)} currency={currency} />
            {` · ${quantity}개`}
          </p>
        </div>
      </button>
    </div>
  );
}
