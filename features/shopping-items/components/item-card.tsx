"use client";

import { useState } from "react";
import { Package, Star } from "lucide-react";
import { toast } from "@/components/common/toast-alert";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyText } from "@/components/common/currency-text";
import type { ShoppingItem } from "../types";
import { lineTotal } from "@/features/budget/utils/calculate-budget";
import { useToggleFavorited } from "../hooks/use-items";
import { ItemDetailSheet } from "./item-detail-sheet";
import { ItemStatusTags } from "./item-status-tags";
import { CoupangDealToggle } from "./coupang-deal-toggle";
import { cn } from "@/lib/utils";

export function ItemCard({
  item,
  currency,
  onToggle,
  toggling,
  showFavorite = false,
}: {
  item: ShoppingItem;
  currency: string;
  onToggle: () => void;
  toggling?: boolean;
  /** 종료 여행에서만 즐겨찾기 노출 */
  showFavorite?: boolean;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const toggleFavorited = useToggleFavorited(item.tripId);

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border border-border/80 bg-background px-3 py-3",
          item.purchased && "opacity-60",
        )}
      >
        <div className="flex items-start gap-3">
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
            onClick={() => setDetailOpen(true)}
          >
            <div className="bg-muted flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl">
              {item.imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageDataUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <Package className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <ItemStatusTags
                purchased={item.purchased}
                giftTags={item.giftTags ?? []}
              />
              <p
                className={cn(
                  "break-words font-medium text-foreground",
                  item.purchased && "line-through",
                )}
              >
                {item.name}
              </p>
              {item.localName?.trim() ? (
                <p className="mt-0.5 break-words text-[10px] leading-snug text-muted-foreground">
                  {item.localName.trim()}
                </p>
              ) : null}
              <p className="mt-0.5 text-sm text-muted-foreground">
                <CurrencyText amount={lineTotal(item)} currency={currency} />
                {` · ${item.quantity >= 1 ? item.quantity : 1}개`}
              </p>
            </div>
          </button>
          {showFavorite ? (
            <button
              type="button"
              aria-label={item.favorited ? "즐겨찾기 해제" : "즐겨찾기"}
              className="mt-0.5 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-primary"
              onClick={() => {
                toggleFavorited.mutate(item.id, {
                  onError: () => toast.error("즐겨찾기 변경에 실패했습니다"),
                });
              }}
            >
              <Star
                className={cn(
                  "size-5",
                  item.favorited && "fill-primary text-primary",
                )}
                strokeWidth={2}
              />
            </button>
          ) : null}
        </div>
        {item.coupangDeal ? (
          <div className="pl-8">
            <CoupangDealToggle deal={item.coupangDeal} />
          </div>
        ) : null}
      </div>
      <ItemDetailSheet
        item={item}
        currency={currency}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        showFavorite={showFavorite}
      />
    </>
  );
}
