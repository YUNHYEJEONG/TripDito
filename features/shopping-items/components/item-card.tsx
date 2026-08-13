"use client";

import Link from "next/link";
import { AlertCircle, Check, Package, Star } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyText } from "@/components/common/currency-text";
import type { ShoppingItem } from "../types";
import { lineTotal } from "@/features/budget/utils/calculate-budget";
import { getGiftTagOption } from "@/features/shopping-items/constants/gift-tags";
import {
  getTripDayNumbers,
  normalizePlannedPurchaseDates,
} from "@/features/shopping-items/utils/trip-day";
import { useToggleFavorited } from "@/features/shopping-items/hooks/use-items";
import { CoupangDealCard } from "@/features/coupang-compare/components/coupang-deal-card";
import { withReturnTo } from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";

export function ItemCard({
  item,
  currency,
  startDate,
  endDate,
  returnTo,
  onToggle,
  toggling,
  showFavorite = false,
}: {
  item: ShoppingItem;
  currency: string;
  startDate: string;
  endDate: string;
  returnTo: string;
  onToggle: () => void;
  toggling?: boolean;
  showFavorite?: boolean;
}) {
  const plannedDates = normalizePlannedPurchaseDates(item);
  const days = getTripDayNumbers(
    startDate,
    endDate,
    plannedDates,
  );
  const toggleFavorited = useToggleFavorited(item.tripId);

  return (
    <article className="relative isolate grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] items-start gap-3">
      <Link
        href={withReturnTo(
          `/trips/${item.tripId}/items/${item.id}/edit`,
          returnTo,
        )}
        aria-label={`${item.name} 상품 수정`}
        className="absolute inset-0 z-10 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      />
      <div className="relative size-28 overflow-hidden rounded-xl bg-paper-2">
        {item.imageDataUrl ? (
          // User-provided data URLs have no stable intrinsic dimensions.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageDataUrl}
            alt={`${item.name} 사진`}
            className={cn(
              "size-full object-cover",
              item.purchased && "opacity-60",
            )}
          />
        ) : (
          <div
            className={cn(
              "flex size-full items-center justify-center",
              item.purchased && "opacity-60",
            )}
          >
            <Package className="size-7 text-ink-3" aria-hidden />
          </div>
        )}

        <Checkbox
          checked={item.purchased}
          disabled={toggling}
          onCheckedChange={() => onToggle()}
          aria-label={`${item.name} 구매 완료`}
          className="absolute top-2 left-2 z-20 size-6 border-control bg-paper shadow-card data-checked:border-success-text data-checked:bg-success-text data-checked:text-paper"
        />

        {showFavorite ? (
          <button
            type="button"
            aria-label={item.favorited ? "즐겨찾기 해제" : "즐겨찾기"}
            aria-pressed={Boolean(item.favorited)}
            disabled={toggleFavorited.isPending}
            className="absolute top-1 right-1 z-20 flex size-11 items-center justify-center rounded-full text-ink-2 outline-none transition-colors hover:bg-paper/90 hover:text-ink active:bg-paper focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
            onClick={() => {
              toggleFavorited.mutate(item.id, {
                onError: () =>
                  toast.error("즐겨찾기를 바꾸지 못했어요. 다시 시도해 주세요."),
              });
            }}
          >
            <Star
              className={cn(
                "size-5",
                item.favorited && "fill-star text-star",
              )}
              aria-hidden
            />
          </button>
        ) : null}

        {item.purchased ? (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-success-text px-2 py-1 text-[11px] font-semibold text-paper">
            <Check className="size-3.5" strokeWidth={3} aria-hidden />
            구매 완료
          </span>
        ) : null}
      </div>

      <div className="min-w-0">
        <div>
          {item.giftTags.length ? (
            <div className="mb-2 flex flex-wrap gap-1">
              {item.giftTags.map((tagId) => (
                <span
                  key={tagId}
                  className={cn(
                    "rounded-xs px-2 py-1 text-[11px] font-semibold text-ink",
                    tagId === "acquaintance" && "bg-gift-acq",
                    tagId === "colleague" && "bg-gift-col",
                    tagId === "friend" && "bg-gift-fri",
                  )}
                >
                  {getGiftTagOption(tagId)?.label}
                </span>
              ))}
            </div>
          ) : null}
          <h3
            className={cn(
              "line-clamp-2 text-[15px] font-semibold leading-5 text-ink",
              item.purchased && "line-through",
            )}
          >
            {item.name}
          </h3>
          {item.localName ? (
            <p className="mt-0.5 line-clamp-1 text-[12px] leading-4 text-ink-2">
              {item.localName}
            </p>
          ) : null}
          <p className="mt-1 text-[14px] font-semibold text-ink">
            <CurrencyText amount={lineTotal(item)} currency={currency} />
            <span className="font-normal text-ink-2"> · {item.quantity}개</span>
          </p>
          {item.memo ? (
            <p className="mt-1 line-clamp-2 text-[12px] leading-[1.4] text-ink-2">
              {item.memo}
            </p>
          ) : null}
          {item.expectedStores?.length ? (
            <p className="mt-1 line-clamp-1 text-[12px] leading-4 text-ink-2">
              구매처 · {item.expectedStores.join(", ")}
            </p>
          ) : null}
          {days.length ? (
            <p className="mt-1 text-[12px] font-medium text-ink-2">
              {days.map((day) => `${day}일차`).join(" · ")}
            </p>
          ) : null}
          {item.priceNeedsReview || item.scheduleNeedsReview ? (
            <p className="mt-2 flex items-start gap-1 text-[11px] leading-4 font-semibold text-ink-2">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {item.priceNeedsReview && item.scheduleNeedsReview
                ? "가격과 구매 일정을 확인해 주세요"
                : item.priceNeedsReview
                  ? "통화가 달라 가격 확인이 필요해요"
                  : "여행 기간에 맞는 구매일을 확인해 주세요"}
            </p>
          ) : null}
        </div>
        {item.coupangDeal ? (
          <div className="relative z-20">
            <CoupangDealCard deal={item.coupangDeal} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
