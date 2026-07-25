"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyText } from "@/components/common/currency-text";
import type { ShoppingItem } from "../types";
import { lineTotal } from "@/features/budget/utils/calculate-budget";
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
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border/80 bg-background px-3 py-3",
        item.purchased && "opacity-60",
      )}
    >
      <Checkbox
        checked={item.purchased}
        disabled={toggling}
        onCheckedChange={() => onToggle()}
        aria-label="구매 완료"
        className="size-5"
      />
      <Link
        href={`/trips/${item.tripId}/items/${item.id}/edit`}
        className="flex min-w-0 flex-1 items-center gap-3"
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
          <p
            className={cn(
              "truncate font-medium text-foreground",
              item.purchased && "line-through",
            )}
          >
            {item.name}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <CurrencyText amount={lineTotal(item)} currency={currency} />
            {` · ${item.quantity >= 1 ? item.quantity : 1}개`}
          </p>
          {item.memo ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {item.memo}
            </p>
          ) : null}
        </div>
      </Link>
    </div>
  );
}
