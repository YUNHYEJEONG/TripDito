"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { AlertCircle, Check, Package, Star, Trash2 } from "lucide-react";
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
import {
  clampItemDeleteSwipeOffset,
  getItemSwipeAxis,
  ITEM_DELETE_REVEAL_WIDTH,
  shouldRevealItemDelete,
  type ItemSwipeAxis,
} from "@/features/shopping-items/utils/item-swipe";
import type { HomeMode } from "@/features/home/utils/get-home-mode";
import { CoupangDealCard } from "@/features/coupang-compare/components/coupang-deal-card";
import { withReturnTo } from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";
import styles from "./item-card.module.css";

export function ItemCard({
  item,
  currency,
  startDate,
  endDate,
  returnTo,
  onToggle,
  mode,
  toggling,
  showFavorite = false,
  deleteRevealed = false,
  deleting = false,
  onRevealDelete,
  onCloseDelete,
  onDelete,
}: {
  item: ShoppingItem;
  currency: string;
  startDate: string;
  endDate: string;
  returnTo: string;
  onToggle: () => void;
  mode: HomeMode;
  toggling?: boolean;
  showFavorite?: boolean;
  deleteRevealed?: boolean;
  deleting?: boolean;
  onRevealDelete?: () => void;
  onCloseDelete?: () => void;
  onDelete?: () => void;
}) {
  const plannedDates = normalizePlannedPurchaseDates(item);
  const days = getTripDayNumbers(startDate, endDate, plannedDates);
  const toggleFavorited = useToggleFavorited(item.tripId);
  const secondaryDetails = [
    item.memo || null,
    item.expectedStores?.length
      ? `구매처 · ${item.expectedStores.join(", ")}`
      : null,
  ].filter((detail): detail is string => Boolean(detail));
  const planningMode = mode === "idle" || mode === "prep";
  const swipeDeleteEnabled = planningMode && Boolean(onDelete);
  const shellRef = useRef<HTMLElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const itemLinkRef = useRef<HTMLAnchorElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);
  const gestureRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    startOffset: number;
    currentOffset: number;
    axis: ItemSwipeAxis;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startOffset: 0,
    currentOffset: 0,
    axis: "pending",
  });

  useEffect(
    () => () => {
      if (suppressClickTimerRef.current !== null) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!deleteRevealed) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!shellRef.current?.contains(event.target as Node)) {
        onCloseDelete?.();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [deleteRevealed, onCloseDelete]);

  function setSwipeOffset(offset: number) {
    surfaceRef.current?.style.setProperty("--swipe-offset", `${offset}px`);
  }

  function finishSwipe(open: boolean) {
    setSwipeOffset(open ? -ITEM_DELETE_REVEAL_WIDTH : 0);
    if (open) onRevealDelete?.();
    else onCloseDelete?.();
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (
      !swipeDeleteEnabled ||
      deleting ||
      event.button !== 0 ||
      (event.target as HTMLElement).closest("button")
    ) {
      return;
    }

    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: deleteRevealed
        ? -ITEM_DELETE_REVEAL_WIDTH
        : 0,
      currentOffset: deleteRevealed
        ? -ITEM_DELETE_REVEAL_WIDTH
        : 0,
      axis: "pending",
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (gesture.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (gesture.axis === "pending") {
      gesture.axis = getItemSwipeAxis(deltaX, deltaY);
      if (gesture.axis === "pending") return;
      if (gesture.axis === "vertical") {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        gesture.pointerId = null;
        setSwipeOffset(
          deleteRevealed ? -ITEM_DELETE_REVEAL_WIDTH : 0,
        );
        return;
      }
      surfaceRef.current?.setAttribute("data-dragging", "true");
    }
    if (gesture.axis !== "horizontal") return;

    event.preventDefault();
    gesture.currentOffset = clampItemDeleteSwipeOffset(
      gesture.startOffset,
      deltaX,
    );
    setSwipeOffset(gesture.currentOffset);
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (gesture.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    gesture.pointerId = null;
    surfaceRef.current?.removeAttribute("data-dragging");
    if (gesture.axis !== "horizontal") {
      setSwipeOffset(
        deleteRevealed ? -ITEM_DELETE_REVEAL_WIDTH : 0,
      );
      return;
    }

    suppressClickRef.current = true;
    if (suppressClickTimerRef.current !== null) {
      window.clearTimeout(suppressClickTimerRef.current);
    }
    suppressClickTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
      suppressClickTimerRef.current = null;
    }, 0);
    finishSwipe(shouldRevealItemDelete(gesture.currentOffset));
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    if (gestureRef.current.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    gestureRef.current.pointerId = null;
    surfaceRef.current?.removeAttribute("data-dragging");
    setSwipeOffset(
      deleteRevealed ? -ITEM_DELETE_REVEAL_WIDTH : 0,
    );
  }

  function handleContentClick(event: React.MouseEvent<HTMLDivElement>) {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
      return;
    }
    if (deleteRevealed) {
      event.preventDefault();
      event.stopPropagation();
      finishSwipe(false);
    }
  }

  function handleContentKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!swipeDeleteEnabled) return;
    if (event.key === "ArrowLeft" || event.key === "Delete") {
      event.preventDefault();
      event.stopPropagation();
      finishSwipe(true);
      window.requestAnimationFrame(() => {
        deleteButtonRef.current?.focus();
      });
    } else if (event.key === "Escape" && deleteRevealed) {
      event.preventDefault();
      finishSwipe(false);
    }
  }

  return (
    <article
      ref={shellRef}
      aria-busy={toggling || deleting || undefined}
      className={cn(styles.swipeShell, "relative isolate min-w-0")}
    >
      <div
        ref={surfaceRef}
        data-purchased={!planningMode && item.purchased}
        data-pending={Boolean(toggling)}
        data-swipe-enabled={swipeDeleteEnabled || undefined}
        data-delete-revealed={deleteRevealed || undefined}
        className={cn(
          styles.itemCard,
          styles.swipeSurface,
          "relative z-10 grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-x-3 bg-paper px-1 py-1",
        )}
        style={
          {
            "--swipe-offset": deleteRevealed
              ? `-${ITEM_DELETE_REVEAL_WIDTH}px`
              : "0px",
          } as CSSProperties
        }
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleContentClick}
        onKeyDown={handleContentKeyDown}
      >
      <Link
        ref={itemLinkRef}
        data-shopping-item-link={item.id}
        href={withReturnTo(
          `/trips/${item.tripId}/items/${item.id}/edit`,
          returnTo,
        )}
        aria-label={`${item.name} 상품 수정`}
        className={cn(
          styles.itemLink,
          "absolute inset-0 z-10 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-text",
        )}
      />

      <div className="relative size-[5.5rem]">
        <div
          className={cn(
            styles.mediaSurface,
            "absolute inset-0 overflow-hidden rounded-lg bg-paper-2",
          )}
        >
          {item.imageDataUrl ? (
            // User-provided data URLs have no stable intrinsic dimensions.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageDataUrl}
              alt={`${item.name} 사진`}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Package className="size-7 text-ink-3" aria-hidden />
            </div>
          )}

          {showFavorite ? (
            <button
              type="button"
              aria-label={item.favorited ? "즐겨찾기 해제" : "즐겨찾기"}
              aria-pressed={Boolean(item.favorited)}
              disabled={toggleFavorited.isPending}
              className="absolute top-1 right-1 z-20 flex size-11 items-center justify-center rounded-full text-ink-2 outline-none transition-colors duration-120 hover:bg-paper/90 hover:text-ink active:bg-paper focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                toggleFavorited.mutate(item.id, {
                  onError: () =>
                    toast.error(
                      "즐겨찾기를 바꾸지 못했어요. 다시 시도해 주세요.",
                    ),
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
        </div>

        {!planningMode ? (
        <div
          data-purchase-toggle-hit
          className={cn(
            "absolute -top-0.5 -left-0.5 z-20 flex size-11 items-center justify-center",
            toggling ? "cursor-wait" : "cursor-pointer",
          )}
          onClick={() => {
            if (!toggling) onToggle();
          }}
        >
          <Checkbox
            checked={item.purchased}
            disabled={toggling}
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={() => onToggle()}
            aria-label={
              item.purchased
                ? `${item.name} 구매 완료 해제`
                : `${item.name} 구매 완료로 표시`
            }
            className="size-6 border-control bg-paper shadow-card after:inset-0 focus-visible:ring-accent-text focus-visible:ring-offset-1 focus-visible:ring-offset-paper data-checked:border-success-text data-checked:bg-success-text data-checked:text-paper"
          />
        </div>
        ) : null}
      </div>

      <div className="min-w-0 self-center">
        <div className="pointer-events-none relative z-10 mb-1 flex min-h-4 items-center gap-1 overflow-hidden">
          {!planningMode && item.purchased ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-xs bg-success-text/10 px-1.5 text-[10px] leading-4 font-semibold text-success-text">
              <Check className="size-3" strokeWidth={3} aria-hidden />
              구매 완료
            </span>
          ) : null}
          {item.giftTags.map((tagId) => (
            <span
              key={tagId}
              className={cn(
                "shrink-0 rounded-xs px-1.5 text-[10px] leading-4 font-semibold text-ink",
                tagId === "acquaintance" && "bg-gift-acq",
                tagId === "colleague" && "bg-gift-col",
                tagId === "friend" && "bg-gift-fri",
              )}
            >
              {getGiftTagOption(tagId)?.label}
            </span>
          ))}
        </div>

        <div>
          <h3 className="min-w-0 text-[14px] leading-[18px] font-semibold text-ink">
            <span className={styles.titleText}>{item.name}</span>
          </h3>

          {item.localName ? (
            <p className="line-clamp-1 text-[11px] leading-4 text-ink-2">
              {item.localName}
            </p>
          ) : null}

          <div className="mt-0.5 flex min-w-0 items-baseline gap-1.5 overflow-hidden whitespace-nowrap">
            <p className="shrink-0 text-[13px] leading-4 font-semibold text-ink">
              <CurrencyText amount={lineTotal(item)} currency={currency} />
              <span className="font-normal text-ink-2">
                {" "}· {item.quantity}개
              </span>
            </p>
            {days.length ? (
              <p className="truncate text-[11px] leading-4 font-medium text-ink-2">
                {days.map((day) => `${day}일차`).join(" · ")}
              </p>
            ) : null}
          </div>

          {secondaryDetails.length ? (
            <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-ink-2">
              {secondaryDetails.join(" · ")}
            </p>
          ) : null}

          {item.priceNeedsReview || item.scheduleNeedsReview ? (
            <p className="mt-1 flex items-start gap-1 text-[10px] leading-[14px] font-semibold text-ink-2">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {item.priceNeedsReview && item.scheduleNeedsReview
                ? "가격과 구매 일정을 확인해 주세요"
                : item.priceNeedsReview
                  ? "통화가 달라 가격 확인이 필요해요"
                  : "여행 기간에 맞는 구매일을 확인해 주세요"}
            </p>
          ) : null}
        </div>
      </div>

      {item.coupangDeal ? (
        <div className="relative z-20 col-span-2 mt-2">
          <CoupangDealCard deal={item.coupangDeal} />
        </div>
      ) : null}
      </div>

      {swipeDeleteEnabled ? (
        <button
          ref={deleteButtonRef}
          id={`item-delete-${item.id}`}
          type="button"
          aria-label={`${item.name} 삭제`}
          aria-hidden={!deleteRevealed}
          tabIndex={deleteRevealed ? 0 : -1}
          disabled={deleting}
          className={styles.deleteAction}
          onFocus={() => onRevealDelete?.()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete?.();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onCloseDelete?.();
              itemLinkRef.current?.focus();
            }
          }}
        >
          <Trash2 className="size-5" strokeWidth={2} aria-hidden />
          <span>{deleting ? "삭제 중" : "삭제"}</span>
        </button>
      ) : null}
    </article>
  );
}
