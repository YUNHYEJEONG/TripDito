"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Star, X } from "lucide-react";
import { toast } from "@/components/common/toast-alert";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CurrencyText } from "@/components/common/currency-text";
import { Button } from "@/components/ui/button";
import { lineTotal } from "@/features/budget/utils/calculate-budget";
import {
  useDeleteItem,
  useItem,
  useToggleFavorited,
  useUpdateItem,
} from "../hooks/use-items";
import {
  getTripDayNumbers,
  normalizePlannedPurchaseDates,
} from "../utils/trip-day";
import type { ShoppingItem } from "../types";
import { ItemForm } from "./item-form";
import { ItemImageFrame } from "./item-image-frame";
import { ItemStatusTags } from "./item-status-tags";
import { useTrip } from "@/features/trips/hooks/use-trips";
import { getTripPhase } from "@/features/home/utils/get-upcoming-trip";
import { cn } from "@/lib/utils";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  if (children == null || children === "") return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-[#EAEDED] py-3 last:border-b-0">
      <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
      <div className="text-[15px] leading-snug text-foreground">{children}</div>
    </div>
  );
}

export function ItemDetailSheet({
  item,
  currency,
  open,
  onOpenChange,
  showFavorite,
}: {
  item: ShoppingItem | null;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showFavorite?: boolean;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const itemId = item?.id ?? "";
  const tripId = item?.tripId ?? "";
  const { data: freshItem } = useItem(itemId);
  const { data: trip } = useTrip(tripId);
  /** 리스트(낙관적 갱신)와 상세 캐시 중 더 최신 데이터를 사용 */
  const displayItem = useMemo(() => {
    if (!item) return freshItem ?? null;
    if (!freshItem) return item;
    return Date.parse(item.updatedAt) >= Date.parse(freshItem.updatedAt)
      ? item
      : freshItem;
  }, [item, freshItem]);
  const updateItem = useUpdateItem(tripId, itemId);
  const deleteItem = useDeleteItem(tripId);
  const toggleFavorited = useToggleFavorited(tripId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const tripEnded = trip ? getTripPhase(trip) === "ended" : false;
  const canFavorite = showFavorite ?? tripEnded;

  useEffect(() => {
    if (!open) setMode("view");
  }, [open]);

  useEffect(() => {
    setMode("view");
  }, [itemId]);

  const quantity =
    displayItem && displayItem.quantity >= 1 ? displayItem.quantity : 1;
  const giftTags = displayItem?.giftTags ?? [];
  const stores = (displayItem?.expectedStores ?? []).filter(Boolean);
  const localName = displayItem?.localName?.trim() || "";
  const memo = displayItem?.memo?.trim() || "";
  const plannedPurchaseDates = displayItem
    ? normalizePlannedPurchaseDates(displayItem)
    : [];
  const dayNumbers =
    trip && displayItem
      ? getTripDayNumbers(trip.startDate, trip.endDate, plannedPurchaseDates)
      : [];

  const handleClose = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto flex max-h-[88vh] max-w-[480px] flex-col rounded-t-2xl md:max-w-[720px] lg:max-w-[960px]"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#D1D5DB]" />
        <SheetHeader className="relative shrink-0 px-4 pt-3 pb-1">
          <SheetTitle className="pr-32 text-left text-[16px] font-bold">
            {mode === "edit" ? "상품 정보 수정" : "상품 정보"}
          </SheetTitle>
          <div className="absolute top-1.5 right-2 flex items-center">
            {displayItem && mode === "view" && canFavorite ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10"
                aria-label={
                  displayItem.favorited ? "즐겨찾기 해제" : "즐겨찾기"
                }
                onClick={() => {
                  toggleFavorited.mutate(displayItem.id, {
                    onError: () => toast.error("즐겨찾기 변경에 실패했습니다"),
                  });
                }}
              >
                <Star
                  className={cn(
                    "size-5",
                    displayItem.favorited && "fill-primary text-primary",
                  )}
                  strokeWidth={2}
                />
              </Button>
            ) : null}
            {displayItem && mode === "view" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10"
                aria-label="수정하기"
                onClick={() => setMode("edit")}
              >
                <Pencil className="size-5" strokeWidth={2} />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10"
              aria-label="닫기"
              onClick={handleClose}
            >
              <X className="size-6" strokeWidth={2} />
            </Button>
          </div>
        </SheetHeader>

        {displayItem ? (
          mode === "view" ? (
            <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 pb-8">
              <ItemImageFrame imageDataUrl={displayItem.imageDataUrl} />

              <div className="border-b border-[#EAEDED] pb-3">
                <ItemStatusTags
                  purchased={displayItem.purchased}
                  giftTags={giftTags}
                  className="mb-3 flex flex-wrap items-center gap-1"
                />
                <p className="text-[12px] font-medium text-muted-foreground">
                  상품명
                </p>
                <div className="mt-0.5 text-[15px] leading-snug text-foreground">
                  {displayItem.name}
                </div>
              </div>
              {localName ? (
                <DetailRow label="현지 상품명">{localName}</DetailRow>
              ) : null}
              {stores.length > 0 ? (
                <DetailRow label="예상 구매처">{stores.join(", ")}</DetailRow>
              ) : null}
              <div className="border-b border-[#EAEDED] py-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[12px] font-medium text-muted-foreground">
                      예상 가격 (개당)
                    </p>
                    <p className="text-[15px] leading-snug text-foreground">
                      <CurrencyText
                        amount={displayItem.estimatedPrice}
                        currency={currency}
                      />
                    </p>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[12px] font-medium text-muted-foreground">
                      수량
                    </p>
                    <p className="text-[15px] leading-snug text-foreground">
                      {quantity}개
                    </p>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[12px] font-medium text-muted-foreground">
                      합계
                    </p>
                    <p className="text-[15px] leading-snug text-foreground">
                      <CurrencyText
                        amount={lineTotal(displayItem)}
                        currency={currency}
                      />
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 border-b border-[#EAEDED] py-3">
                <p className="text-[12px] font-medium text-muted-foreground">
                  구매 예정일
                </p>
                <div className="min-h-[1.4em] text-[15px] leading-snug text-foreground">
                  {dayNumbers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {dayNumbers.map((day) => (
                        <span
                          key={day}
                          className="rounded bg-[#F2F4F6] px-1.5 py-0.5 text-[11px] font-semibold text-[#191F28]"
                        >
                          {day}일차
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col gap-0.5 border-b border-[#EAEDED] py-3 last:border-b-0">
                <p className="text-[12px] font-medium text-muted-foreground">
                  메모
                </p>
                <div className="min-h-[1.4em] text-[12px] leading-snug whitespace-pre-wrap text-foreground">
                  {memo || null}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col px-4">
              <ItemForm
                key={displayItem.id}
                defaultValues={displayItem}
                currency={currency}
                purchased={displayItem.purchased}
                tripStartDate={trip?.startDate}
                tripEndDate={trip?.endDate}
                submitLabel="수정"
                onCancel={() => setMode("view")}
                onSubmit={async (values) => {
                  try {
                    await updateItem.mutateAsync(values);
                    toast.success("상품을 수정했습니다");
                    setMode("view");
                  } catch {
                    toast.error("저장에 실패했습니다");
                  }
                }}
              >
                <div className="border-t border-border/60 pt-4">
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={() => setConfirmOpen(true)}
                  >
                    상품 삭제
                  </Button>
                </div>
              </ItemForm>
            </div>
          )
        ) : null}
      </SheetContent>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="상품을 삭제할까요?"
        confirmLabel="삭제"
        loading={deleteItem.isPending}
        onConfirm={() => {
          deleteItem.mutate(itemId, {
            onSuccess: () => {
              toast.success("상품을 삭제했습니다");
              setConfirmOpen(false);
              onOpenChange(false);
            },
            onError: () => toast.error("삭제에 실패했습니다"),
          });
        }}
      />
    </Sheet>
  );
}
