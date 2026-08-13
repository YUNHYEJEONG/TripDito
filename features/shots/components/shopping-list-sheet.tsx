"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ImageOff, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SheetCloseHeader } from "@/components/common/sheet-close-header";
import { CurrencyText } from "@/components/common/currency-text";
import { itemRepository } from "@/features/shopping-items/data/item-repository";
import { useCopyItemsToTrip } from "@/features/shopping-items/hooks/use-items";
import { tripRepository } from "@/features/trips/data/trip-repository";
import { useTrips } from "@/features/trips/hooks/use-trips";
import { useLocalProfile } from "@/features/profile/hooks/use-local-profile";
import { cn } from "@/lib/utils";

function formatTripStay(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  const nightMs = end.getTime() - start.getTime();
  const nights = Math.max(0, Math.round(nightMs / (24 * 60 * 60 * 1000)));
  const days = nights + 1;
  return `${nights}박 ${days}일`;
}

function formatTripOptionLabel(startDate: string, city: string) {
  if (!startDate) return city;
  const [y, m, d] = startDate.split("-");
  if (!y || !m || !d) return `${startDate} ${city}`;
  return `${y}.${m}.${d} ${city}`;
}

export function ShoppingListSheet({
  open,
  onOpenChange,
  nickname,
  shotAuthorId,
  tripId,
  destinationCity,
  itemIds,
  shotId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nickname: string;
  shotAuthorId: string;
  tripId: string;
  destinationCity?: string;
  itemIds: string[];
  shotId: string;
}) {
  const router = useRouter();
  const { data: profile } = useLocalProfile();
  const { data: trips = [] } = useTrips();
  const copyItems = useCopyItemsToTrip();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickOpen, setPickOpen] = useState(false);

  const isOwnList = Boolean(profile?.id && profile.id === shotAuthorId);

  const items = itemIds
    .map((id) => itemRepository.getById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const trip = tripRepository.getById(tripId);

  const placeName = trip?.city ?? destinationCity ?? "";
  const stayLabel =
    trip?.startDate && trip?.endDate
      ? formatTripStay(trip.startDate, trip.endDate)
      : null;
  const tripMeta =
    placeName && stayLabel
      ? `${placeName} · ${stayLabel}`
      : placeName || stayLabel;

  const allSelected =
    items.length > 0 && selectedIds.length === items.length;
  const selectedCount = selectedIds.length;

  function handleSheetOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedIds([]);
      setPickOpen(false);
    }
    onOpenChange(nextOpen);
  }

  function toggleItem(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(items.map((item) => item.id));
  }

  async function copyToTrip(targetTripId: string) {
    if (selectedIds.length === 0) return;
    try {
      const created = await copyItems.mutateAsync({
        sourceItemIds: selectedIds,
        targetTripId,
      });
      const target = tripRepository.getById(targetTripId);
      const count = created.length;
      const needsReview = created.some(
        (item) => item.priceNeedsReview || item.scheduleNeedsReview,
      );
      handleSheetOpenChange(false);
      toast.success(
        target
          ? `${target.city} 리스트에 ${count}개 담았어요${needsReview ? ". 표시된 가격·구매일만 확인해 주세요" : ""}`
          : `내 리스트에 ${count}개 담았어요${needsReview ? ". 표시된 가격·구매일만 확인해 주세요" : ""}`,
        {
          action: {
            label: "바로가기",
            onClick: () => router.push(`/trips/${targetTripId}`),
          },
        },
      );
    } catch {
      toast.error("상품을 담지 못했어요. 다시 시도해 주세요.");
    }
  }

  function handleAddToList() {
    if (selectedIds.length === 0) {
      toast.error("담을 상품을 먼저 선택해 주세요");
      return;
    }
    if (trips.length === 0) {
      const params = new URLSearchParams({ returnTo: `/shots#${shotId}` });
      selectedIds.forEach((id) => params.append("copyItemId", id));
      router.push(`/trips/new?${params.toString()}`);
      return;
    }
    if (trips.length === 1) {
      void copyToTrip(trips[0].id);
      return;
    }
    setPickOpen(true);
  }

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto flex max-h-[80dvh] max-w-[480px] flex-col rounded-t-2xl"
      >
        {pickOpen ? (
          <>
            <div className="flex min-h-14 shrink-0 items-center gap-1 px-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="쇼핑리스트로 돌아가기"
                onClick={() => setPickOpen(false)}
              >
                <ArrowLeft className="size-5" aria-hidden />
              </Button>
              <SheetTitle className="min-w-0 flex-1 truncate text-center text-[16px] font-bold">
                담을 여행 선택
              </SheetTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="닫기"
                onClick={() => handleSheetOpenChange(false)}
              >
                <X className="size-5" aria-hidden />
              </Button>
            </div>
            <p className="px-4 pb-2 text-[13px] leading-5 text-ink-2">
              {selectedCount}개 상품을 담을 여행을 선택해 주세요.
            </p>
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
              {trips.map((targetTrip) => (
                <li key={targetTrip.id}>
                  <button
                    type="button"
                    disabled={copyItems.isPending}
                    onClick={() => void copyToTrip(targetTrip.id)}
                    className="flex min-h-14 w-full items-center gap-3 rounded-xl bg-paper-2 px-3 py-3 text-left outline-none transition-colors duration-120 hover:bg-paper-3 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:text-ink-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold">
                        {targetTrip.city}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-ink-2 tabular-nums">
                        {formatTripOptionLabel(
                          targetTrip.startDate,
                          targetTrip.name,
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] font-semibold text-accent-text">
                      선택
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <SheetCloseHeader
              className="shrink-0"
              title={`${nickname}님의 쇼핑리스트`}
              description={tripMeta || undefined}
              onClose={() => handleSheetOpenChange(false)}
            />

            {!isOwnList && items.length > 0 ? (
              <div className="flex shrink-0 items-center justify-between px-4 pt-2 pb-1">
                <button
                  type="button"
                  aria-pressed={allSelected}
                  onClick={toggleAll}
                  className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-[13px] text-ink outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded border text-[11px]",
                      allSelected
                        ? "border-accent-text bg-accent-text text-paper"
                        : "border-paper-3 bg-paper",
                    )}
                    aria-hidden
                  >
                    {allSelected ? "✓" : ""}
                  </span>
                  전체 선택
                </button>
                <span className="text-[12px] text-ink-2 tabular-nums">
                  {selectedCount}개 선택
                </span>
              </div>
            ) : null}

            <ul className="mt-1 min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-3">
              {items.length === 0 ? (
                <li className="py-8 text-center text-[13px] text-ink-2">
                  연결된 상품이 없어요
                </li>
              ) : (
                items.map((item) => {
                  const checked = selectedIds.includes(item.id);
                  return (
                    <li key={item.id}>
                      {isOwnList ? (
                        <div className="flex items-center gap-3 rounded-xl bg-paper-2 px-3 py-3">
                          <ItemThumb src={item.imageDataUrl} name={item.name} />
                          <ItemMeta
                            name={item.name}
                            price={item.estimatedPrice}
                            currency={trip?.currency ?? "JPY"}
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          aria-pressed={checked}
                          onClick={() => toggleItem(item.id)}
                          className={cn(
                            "flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-3 text-left outline-none transition-colors duration-120 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                            checked
                              ? "border-accent bg-accent/10 hover:bg-accent/15 active:bg-accent/20"
                              : "border-transparent bg-paper-2 hover:bg-paper-3 active:bg-paper-3",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded border text-[11px]",
                              checked
                                ? "border-accent-text bg-accent-text text-paper"
                                : "border-paper-3 bg-paper",
                            )}
                            aria-hidden
                          >
                            {checked ? "✓" : ""}
                          </span>
                          <ItemThumb src={item.imageDataUrl} name={item.name} />
                          <ItemMeta
                            name={item.name}
                            price={item.estimatedPrice}
                            currency={trip?.currency ?? "JPY"}
                          />
                        </button>
                      )}
                    </li>
                  );
                })
              )}
            </ul>

            {!isOwnList && items.length > 0 ? (
              <div className="shrink-0 border-t border-rule px-4 py-3">
                <Button
                  type="button"
                  className="w-full"
                  disabled={selectedCount === 0 || copyItems.isPending}
                  onClick={handleAddToList}
                >
                  내 리스트에 담기
                  {selectedCount > 0 ? ` · ${selectedCount}개` : ""}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ItemThumb({ src, name }: { src: string | null; name: string }) {
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-paper">
      {src ? (
        <Image
          src={src}
          alt={`${name} 상품 이미지`}
          fill
          unoptimized
          sizes="48px"
          className="object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-ink-3">
          <ImageOff className="size-4" aria-hidden />
          <span className="sr-only">상품 이미지 없음</span>
        </div>
      )}
    </div>
  );
}

function ItemMeta({
  name,
  price,
  currency,
}: {
  name: string;
  price: number;
  currency: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-[14px] font-semibold">{name}</p>
      <p className="mt-1 text-[12px] text-ink-2">
        <CurrencyText amount={price} currency={currency} />
      </p>
    </div>
  );
}
