"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nickname: string;
  shotAuthorId: string;
  tripId: string;
  destinationCity?: string;
  itemIds: string[];
}) {
  const router = useRouter();
  const { data: profile } = useLocalProfile();
  const { data: trips = [] } = useTrips();
  const copyItems = useCopyItemsToTrip();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickOpen, setPickOpen] = useState(false);

  const isOwnList = Boolean(profile?.id && profile.id === shotAuthorId);

  const items = useMemo(() => {
    return itemIds
      .map((id) => itemRepository.getById(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [itemIds, open]);

  const trip = useMemo(
    () => tripRepository.getById(tripId),
    [tripId, open],
  );

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

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setPickOpen(false);
    }
  }, [open]);

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
      setPickOpen(false);
      setSelectedIds([]);
      const target = tripRepository.getById(targetTripId);
      const count = created.length;
      toast.success(
        target
          ? `${target.city} 쇼핑리스트에 ${count}개 담았어요`
          : `내 쇼핑리스트에 ${count}개 담았어요`,
        {
          action: {
            label: "바로가기",
            onClick: () => router.push(`/trips/${targetTripId}`),
          },
        },
      );
    } catch {
      toast.error("퍼가기에 실패했습니다");
    }
  }

  function handlePergagi() {
    if (selectedIds.length === 0) {
      toast.error("퍼갈 상품을 선택해 주세요");
      return;
    }
    if (trips.length === 0) {
      toast.error("담을 여행이 없어요. 여행을 먼저 만들어 주세요.", {
        action: {
          label: "여행 만들기",
          onClick: () => router.push("/trips/new"),
        },
      });
      return;
    }
    if (trips.length === 1) {
      void copyToTrip(trips[0].id);
      return;
    }
    setPickOpen(true);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="mx-auto flex max-h-[80vh] max-w-[480px] flex-col rounded-t-2xl md:max-w-[720px] lg:max-w-[960px]"
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#D1D5DB]" />
          <SheetCloseHeader
            className="shrink-0"
            title={`${nickname} 님의 쇼핑리스트 목록`}
            description={tripMeta || undefined}
            onClose={() => onOpenChange(false)}
          />

          {!isOwnList && items.length > 0 ? (
            <div className="flex shrink-0 items-center justify-between px-4 pt-2 pb-1">
              <button
                type="button"
                onClick={toggleAll}
                className="flex items-center gap-2 text-[13px] text-foreground"
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded border text-[11px]",
                    allSelected
                      ? "border-primary bg-primary text-white"
                      : "border-[#CFD4DA] bg-white",
                  )}
                  aria-hidden
                >
                  {allSelected ? "✓" : ""}
                </span>
                전체 선택
              </button>
              <span className="text-[12px] text-muted-foreground">
                {selectedCount}개 선택
              </span>
            </div>
          ) : null}

          <ul className="mt-1 min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-3">
            {items.length === 0 ? (
              <li className="py-8 text-center text-[13px] text-muted-foreground">
                연결된 상품이 없습니다
              </li>
            ) : (
              items.map((item) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <li key={item.id}>
                    {isOwnList ? (
                      <div className="flex items-center gap-3 rounded-xl bg-[#F2F4F6] px-3 py-2.5">
                        <ItemThumb src={item.imageDataUrl} />
                        <ItemMeta
                          name={item.name}
                          price={item.estimatedPrice}
                          currency={trip?.currency ?? "JPY"}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                          checked
                            ? "border-primary bg-primary/10"
                            : "border-transparent bg-[#F2F4F6]",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded border text-[11px]",
                            checked
                              ? "border-primary bg-primary text-white"
                              : "border-[#CFD4DA] bg-white",
                          )}
                          aria-hidden
                        >
                          {checked ? "✓" : ""}
                        </span>
                        <ItemThumb src={item.imageDataUrl} />
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
            <div className="shrink-0 border-t border-[#EAEDED] px-4 py-3">
              <Button
                type="button"
                className="w-full"
                disabled={selectedCount === 0 || copyItems.isPending}
                onClick={handlePergagi}
              >
                퍼가기
                {selectedCount > 0 ? ` · ${selectedCount}개` : ""}
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={pickOpen} onOpenChange={setPickOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="mx-auto max-h-[70vh] max-w-[480px] rounded-t-2xl md:max-w-[720px] lg:max-w-[960px]"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#D1D5DB]" />
          <SheetCloseHeader
            title="담을 여행 선택"
            description={`${selectedCount}개 상품을 퍼갈 여행을 골라 주세요.`}
            onClose={() => setPickOpen(false)}
          />
          <ul className="mt-3 flex max-h-[50vh] flex-col gap-2 overflow-y-auto px-4 pb-6">
            {trips.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  disabled={copyItems.isPending}
                  onClick={() => void copyToTrip(t.id)}
                  className="flex w-full items-center rounded-xl border border-transparent bg-[#F2F4F6] px-3 py-3 text-left transition-colors hover:bg-[#E8ECF0] disabled:opacity-50"
                >
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
                    {formatTripOptionLabel(t.startDate, t.city)}
                  </span>
                  <span className="shrink-0 text-[12px] text-muted-foreground">
                    {t.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ItemThumb({ src }: { src: string | null }) {
  return (
    <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-background">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
          No img
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
      <p className="mt-0.5 text-[12px] text-muted-foreground">
        <CurrencyText amount={price} currency={currency} />
      </p>
    </div>
  );
}
