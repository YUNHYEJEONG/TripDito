"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyText } from "@/components/common/currency-text";
import type { ShoppingItem } from "../types";
import { lineTotal } from "@/features/budget/utils/calculate-budget";
import { ItemDetailSheet } from "./item-detail-sheet";
import { ItemStatusTags } from "./item-status-tags";
import { cn } from "@/lib/utils";

export function ItemCard({
  item,
  currency,
  onToggle,
  toggling,
}: {
  item: ShoppingItem;
  currency: string;
  onToggle: () => void;
  toggling?: boolean;
}) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border border-border/80 bg-background px-3 py-3",
          item.purchased && "opacity-60",
        )}
      >
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
      </div>
      <ItemDetailSheet
        item={item}
        currency={currency}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
