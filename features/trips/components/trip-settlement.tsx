"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  Check,
  Glasses,
  Gift,
  Headphones,
  Map as MapIcon,
  PackageOpen,
  Pencil,
  ReceiptText,
  Shirt,
  ShoppingBag,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { CurrencyText } from "@/components/common/currency-text";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHandle,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { BudgetSummary } from "@/features/budget/utils/calculate-budget";
import { lineTotal } from "@/features/budget/utils/calculate-budget";
import { GIFT_TAG_OPTIONS } from "@/features/shopping-items/constants/gift-tags";
import { useToggleFavorited } from "@/features/shopping-items/hooks/use-items";
import type { ShoppingItem } from "@/features/shopping-items/types";
import {
  getSettlementBudgetViewModel,
  getSettlementFallbackVariant,
  getSettlementGaugeProgress,
  getSettlementGiftLabels,
  getSettlementPurchaseDayLabel,
} from "@/features/trips/utils/trip-settlement";
import { formatCurrency } from "@/lib/format/currency";
import { withReturnTo } from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";
import styles from "./trip-settlement.module.css";

const giftClassByLabel = new Map(
  GIFT_TAG_OPTIONS.map(({ label, className }) => [label, className]),
);

const fallbackStyles = [
  {
    surface: "bg-after-tint text-after-deep",
    firstMotif:
      "-top-8 -right-6 size-28 rounded-full border-[18px] border-paper/35",
    secondMotif:
      "-bottom-10 -left-8 size-32 rounded-full border-[22px] border-after-deep/10",
    Icon: PackageOpen,
  },
  {
    surface: "bg-live-tint text-live-deep",
    firstMotif:
      "-top-6 right-2 h-24 w-12 rotate-12 rounded-2xl border-[12px] border-paper/35",
    secondMotif:
      "-bottom-8 left-1 h-24 w-20 -rotate-12 rounded-3xl border-[16px] border-live-deep/10",
    Icon: ShoppingBag,
  },
  {
    surface: "bg-prep-tint text-prep-deep",
    firstMotif: "top-5 -right-8 h-8 w-32 -rotate-12 rounded-full bg-paper/30",
    secondMotif:
      "bottom-5 -left-8 h-10 w-36 rotate-12 rounded-full bg-prep-deep/10",
    Icon: ReceiptText,
  },
  {
    surface: "bg-paper-3 text-ink-2",
    firstMotif:
      "-top-7 -left-7 size-24 rotate-12 rounded-2xl border-[14px] border-paper/50",
    secondMotif:
      "-right-8 -bottom-8 size-28 -rotate-12 rounded-3xl border-[18px] border-ink-2/10",
    Icon: Gift,
  },
] as const;

export function TripSettlementLoading() {
  return (
    <div
      className="space-y-4"
      aria-busy="true"
      aria-label="여행 결산 불러오는 중"
    >
      <section className="relative overflow-hidden rounded-2xl border border-after-tint bg-after p-3 shadow-[0_8px_22px_rgba(165,82,0,0.09)]">
        <div className="flex justify-center opacity-55" aria-hidden>
          <SuitcaseArtwork fillPercent={0} />
        </div>

        <dl className="mt-2 space-y-1" aria-hidden>
          {["budget", "recorded", "balance"].map((row) => (
            <div
              key={row}
              className="flex min-h-7 items-center justify-between gap-3"
            >
              <div className="h-3 w-10 rounded bg-after-deep/10" />
              <div className="h-4 w-24 rounded bg-after-deep/15" />
            </div>
          ))}
        </dl>
      </section>

      <div className="grid grid-cols-3 gap-px bg-paper" aria-hidden>
        <div className="aspect-square bg-paper-2" />
        <div className="aspect-square bg-paper-3" />
        <div className="aspect-square bg-paper-2" />
      </div>
    </div>
  );
}

export function SettlementMemoryOverview({
  summary,
  currency,
  budgetMode,
  hasPriceReview = false,
}: {
  summary: BudgetSummary;
  currency: string;
  budgetMode: "unknown" | "input" | undefined;
  hasPriceReview?: boolean;
}) {
  const budget = getSettlementBudgetViewModel(summary, budgetMode);
  const amountSizeTier = getAmountSizeTier(
    [budget.budgetAmount, budget.recordedAmount, budget.balanceAmount],
    currency,
  );

  return (
    <section
      aria-labelledby="settlement-memory-title"
      className="relative overflow-hidden rounded-2xl border border-after-tint bg-after p-3 text-ink shadow-[0_8px_22px_rgba(165,82,0,0.09)]"
    >
      <h2 id="settlement-memory-title" className="sr-only">
        여행 예산과 기록 금액
      </h2>
      <div className="flex justify-center">
        <SuitcasePackingGauge
          purchasedCount={summary.purchasedCount}
          totalCount={summary.totalCount}
        />
      </div>

      <dl className="mt-2 px-1">
        <BudgetAmount
          label="예산"
          amount={budget.budgetAmount}
          currency={currency}
          unknownLabel="미입력"
          scale="budget"
          sizeTier={amountSizeTier}
        />

        <BudgetAmount
          label="기록 금액"
          amount={budget.recordedAmount}
          currency={currency}
          scale="recorded"
          sizeTier={amountSizeTier}
          review={hasPriceReview}
        />

        {budget.balanceAmount !== null ? (
          <BudgetAmount
            label={budget.balanceLabel}
            amount={budget.balanceAmount}
            currency={currency}
            danger={budget.balanceDanger}
            scale="balance"
            sizeTier={amountSizeTier}
          />
        ) : null}
      </dl>
    </section>
  );
}

const suitcaseItems = [
  { Icon: Shirt, className: "top-3 left-4 -rotate-6" },
  { Icon: Camera, className: "top-2.5 left-1/2 -translate-x-1/2 rotate-3" },
  { Icon: Glasses, className: "top-3 right-3 -rotate-3" },
  { Icon: MapIcon, className: "bottom-2.5 left-5 rotate-3" },
  { Icon: Headphones, className: "right-5 bottom-2.5 -rotate-6" },
] as const;

function SuitcaseFace({ filled }: { filled: boolean }) {
  return (
    <div
      className={cn(
        "absolute inset-0",
        filled ? "bg-after-deep" : "bg-paper/60",
      )}
    >
      {suitcaseItems.map(({ Icon, className }) => (
        <Icon
          key={className}
          className={cn(
            "absolute size-7 min-[390px]:size-8",
            filled ? "text-paper" : "text-after-deep/40",
            className,
          )}
          strokeWidth={1.9}
          aria-hidden
        />
      ))}
    </div>
  );
}

function SuitcaseArtwork({ fillPercent }: { fillPercent: number }) {
  const safeFill = Number.isFinite(fillPercent)
    ? Math.min(100, Math.max(0, fillPercent))
    : 0;

  return (
    <div
      data-settlement-suitcase
      className="relative mx-auto h-[116px] w-[148px] min-[390px]:h-[126px] min-[390px]:w-[164px]"
    >
      <span className="absolute top-0 left-1/2 h-3 w-12 -translate-x-1/2 rounded-t-md border-x-2 border-t-2 border-after-deep" />
      <div className="absolute inset-x-0 top-2.5 bottom-1 overflow-hidden rounded-[20px] border-2 border-after-deep shadow-[inset_0_0_0_2px_rgba(255,255,255,0.28)]">
        <SuitcaseFace filled={false} />
        <div
          data-settlement-suitcase-fill
          className="absolute inset-0 overflow-hidden [transition-property:clip-path] duration-200 ease-out motion-reduce:transition-none"
          style={{
            clipPath: `inset(${100 - safeFill}% 0 0 0)`,
          }}
        >
          <SuitcaseFace filled />
        </div>
        <span className="pointer-events-none absolute inset-x-2 top-1 h-px bg-paper/55" />
      </div>
      <span className="absolute right-3 bottom-0 size-2 rounded-full bg-after-deep" />
      <span className="absolute bottom-0 left-3 size-2 rounded-full bg-after-deep" />
    </div>
  );
}

function SuitcasePackingGauge({
  purchasedCount,
  totalCount,
}: {
  purchasedCount: number;
  totalCount: number;
}) {
  const safeTotal = Number.isFinite(totalCount)
    ? Math.max(0, Math.floor(totalCount))
    : 0;
  const safePurchased = Number.isFinite(purchasedCount)
    ? Math.min(safeTotal, Math.max(0, Math.floor(purchasedCount)))
    : 0;
  const progress = getSettlementGaugeProgress(safePurchased, safeTotal);
  const displayPercent =
    progress.rawPercent === null ? null : Math.round(progress.rawPercent);
  const suitcase = (
    <div aria-hidden>
      <SuitcaseArtwork fillPercent={progress.visualPercent} />
    </div>
  );

  if (displayPercent === null) {
    return (
      <div
        className="shrink-0"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label="저장한 상품이 없어 구매 완료율을 계산할 수 없어요"
      >
        {suitcase}
      </div>
    );
  }

  return (
    <div
      className="shrink-0"
      role="progressbar"
      aria-label="구매 완료율"
      aria-valuemin={0}
      aria-valuenow={displayPercent}
      aria-valuemax={100}
      aria-valuetext={`전체 상품 ${safeTotal}개 중 ${safePurchased}개 구매 완료, ${displayPercent}퍼센트`}
      aria-live="polite"
      aria-atomic="true"
    >
      {suitcase}
    </div>
  );
}

type AmountSizeTier = "short" | "medium" | "long";

const amountSizeClass = {
  short: {
    budget: "text-[15px] min-[390px]:text-[16px]",
    recorded: "text-[19px] min-[390px]:text-[20px]",
    balance: "text-[14px] min-[390px]:text-[15px]",
  },
  medium: {
    budget: "text-[14px] min-[390px]:text-[15px]",
    recorded: "text-[17px] min-[390px]:text-[18px]",
    balance: "text-[13px] min-[390px]:text-[14px]",
  },
  long: {
    budget: "text-[12px] min-[390px]:text-[13px]",
    recorded: "text-[15px] min-[390px]:text-[16px]",
    balance: "text-[12px] min-[390px]:text-[13px]",
  },
} as const;

function getAmountSizeTier(
  amounts: Array<number | null>,
  currency: string,
): AmountSizeTier {
  const longest = amounts.reduce<number>(
    (length, amount) =>
      amount === null
        ? length
        : Math.max(length, formatCurrency(amount, currency).length),
    0,
  );

  if (longest >= 16) return "long";
  if (longest >= 13) return "medium";
  return "short";
}

function BudgetAmount({
  label,
  amount,
  currency,
  unknownLabel,
  danger = false,
  review = false,
  scale,
  sizeTier,
}: {
  label: string;
  amount: number | null;
  currency: string;
  unknownLabel?: string;
  danger?: boolean;
  review?: boolean;
  scale: "budget" | "recorded" | "balance";
  sizeTier: AmountSizeTier;
}) {
  return (
    <div
      className={cn(
        "flex min-h-7 min-w-0 items-baseline justify-between gap-3 py-1",
        scale === "recorded" &&
          "-mx-2 rounded-lg bg-after-tint/55 px-2 py-1.5",
      )}
    >
      <dt
        className={cn(
          "flex shrink-0 items-center gap-1 text-[11px] leading-4 font-bold",
          scale === "recorded" ? "text-after-deep" : "text-after-ink-2",
        )}
      >
        {label}
        {review ? (
          <>
            <AlertCircle
              className="size-3.5 text-danger-text"
              aria-hidden
            />
            <span className="sr-only">가격 확인 필요</span>
          </>
        ) : null}
      </dt>
      <dd
        className={cn(
          "min-w-0 text-right leading-none font-black tracking-[-0.03em] whitespace-nowrap tabular-nums",
          amountSizeClass[sizeTier][scale],
          scale === "budget" && "text-ink",
          scale === "recorded" && "text-after-deep",
          scale === "balance" && "text-ink",
          danger && "text-danger-text",
        )}
      >
        {amount === null ? (
          unknownLabel
        ) : (
          <CurrencyText amount={amount} currency={currency} />
        )}
      </dd>
    </div>
  );
}

export function SettlementProductGrid({
  items,
  currency,
  startDate,
  endDate,
  returnTo,
}: {
  items: ShoppingItem[];
  currency: string;
  startDate: string;
  endDate: string;
  returnTo: string;
}) {
  const detailsId = useId();
  const gridRef = useRef<HTMLElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;

  return (
    <Sheet
      open={detailsOpen && Boolean(selectedItem)}
      onOpenChange={setDetailsOpen}
      onOpenChangeComplete={(open) => {
        if (open) return;
        const trigger = lastTriggerRef.current;
        if (trigger?.isConnected) trigger.focus();
        else gridRef.current?.focus();
      }}
    >
      <section
        ref={gridRef}
        tabIndex={-1}
        aria-label="여행 쇼핑 상품"
        className="outline-none"
      >
        <ul className="grid min-w-0 grid-cols-3 gap-px bg-paper">
          {items.map((item) => (
            <SettlementProductTile
              key={item.id}
              item={item}
              currency={currency}
              startDate={startDate}
              endDate={endDate}
              detailsId={detailsId}
              expanded={detailsOpen && selectedItemId === item.id}
              onOpenDetails={(trigger) => {
                lastTriggerRef.current = trigger;
                setSelectedItemId(item.id);
                setDetailsOpen(true);
              }}
            />
          ))}
        </ul>
      </section>

      {selectedItem ? (
        <SettlementProductDetails
          id={detailsId}
          item={selectedItem}
          currency={currency}
          startDate={startDate}
          endDate={endDate}
          returnTo={returnTo}
        />
      ) : null}
    </Sheet>
  );
}

function SettlementProductTile({
  item,
  currency,
  startDate,
  endDate,
  detailsId,
  expanded,
  onOpenDetails,
}: {
  item: ShoppingItem;
  currency: string;
  startDate: string;
  endDate: string;
  detailsId: string;
  expanded: boolean;
  onOpenDetails: (trigger: HTMLButtonElement) => void;
}) {
  const giftLabels = getSettlementGiftLabels(item);
  const dayLabel = getSettlementPurchaseDayLabel(item, startDate, endDate);
  const storeLabel = item.expectedStores?.length
    ? item.expectedStores.join(", ")
    : "미기록";
  const reviewLabel = [
    item.priceNeedsReview ? "가격 확인 필요" : null,
    item.scheduleNeedsReview ? "일정 확인 필요" : null,
  ]
    .filter(Boolean)
    .join(", ");
  const accessibilityLabel = [
    item.name,
    item.purchased ? "구매 완료" : "미구매",
    giftLabels.length > 0 ? `선물 대상 ${giftLabels.join(", ")}` : null,
    reviewLabel || null,
    "상세 보기",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <li className="group relative isolate aspect-square min-w-0 overflow-hidden bg-paper-2">
      <SettlementItemVisual item={item} decorative />

      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={expanded}
        aria-controls={detailsId}
        aria-label={accessibilityLabel}
        className="peer absolute inset-0 z-20 outline-none active:bg-ink/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
        onClick={(event) => onOpenDetails(event.currentTarget)}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-ink/45 opacity-0 transition-opacity duration-150 peer-focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
      />

      <div
        aria-hidden
        className={cn(
          styles.previewGlass,
          "pointer-events-none absolute inset-x-1 bottom-1 z-10 max-h-[calc(100%-0.5rem)] overflow-hidden border border-paper/25 px-1.5 py-1.5 opacity-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-opacity duration-150 peer-focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100",
        )}
      >
        <p className="truncate text-[12px] leading-4 font-extrabold">
          {item.name}
        </p>
        <p className="truncate text-[11px] leading-3 font-bold">
          <span className="text-paper/70">기록 </span>
          <CurrencyText amount={lineTotal(item)} currency={currency} />
        </p>
        <p className="mt-0.5 truncate text-[11px] leading-3 text-paper/90">
          <span className="text-paper/70">구매처 메모 </span>
          {storeLabel}
        </p>
        <p className="mt-0.5 flex min-w-0 items-center justify-between gap-1 text-[11px] leading-3 text-paper/90">
          <span className="min-w-0 truncate">{dayLabel}</span>
          <span className="shrink-0">{item.quantity}개</span>
        </p>
      </div>

      <span
        data-purchase-status={item.purchased ? "purchased" : "unpurchased"}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-30 flex size-11 items-center justify-center"
      >
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-md border-2",
            item.purchased
              ? "border-success-text bg-success-text text-paper"
              : "border-ink/55 bg-paper/90 text-transparent",
          )}
        >
          <Check className="size-4" strokeWidth={3} />
        </span>
      </span>

      {giftLabels.length > 0 ? (
        <div
          aria-hidden
          className="pointer-events-none absolute top-1 right-1 z-30 flex max-w-[calc(100%-2.75rem)] flex-col items-end gap-1 overflow-hidden"
        >
          {giftLabels.slice(0, 1).map((label) => (
            <span
              key={label}
              className={cn(
                "max-w-full truncate rounded-[2px] border border-paper/65 px-1.5 py-1 text-[10px] leading-none font-bold",
                giftClassByLabel.get(label) ?? "bg-paper/92 text-ink",
              )}
            >
              {label}
            </span>
          ))}
          {giftLabels.length > 1 ? (
            <span className="rounded-[2px] border border-paper/65 bg-paper/92 px-1.5 py-1 text-[10px] leading-none font-bold text-ink">
              +{giftLabels.length - 1}
            </span>
          ) : null}
        </div>
      ) : null}

      {item.priceNeedsReview || item.scheduleNeedsReview ? (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-1 left-1 z-30 flex size-6 items-center justify-center rounded-[2px] bg-paper/92 text-danger-text"
        >
          <AlertCircle className="size-3.5" />
        </span>
      ) : null}
    </li>
  );
}

function SettlementProductDetails({
  id,
  item,
  currency,
  startDate,
  endDate,
  returnTo,
}: {
  id: string;
  item: ShoppingItem;
  currency: string;
  startDate: string;
  endDate: string;
  returnTo: string;
}) {
  const toggleFavorited = useToggleFavorited(item.tripId);
  const giftLabels = getSettlementGiftLabels(item);
  const dayLabel = getSettlementPurchaseDayLabel(item, startDate, endDate);
  const storeLabel = item.expectedStores?.length
    ? item.expectedStores.join(", ")
    : "미기록";
  const editHref = withReturnTo(
    `/trips/${item.tripId}/items/${item.id}/edit`,
    returnTo,
  );

  return (
    <SheetContent id={id} side="bottom" className="max-h-[82dvh] p-0">
      <SheetHandle />
      <SheetHeader className="border-b border-rule pr-16">
        <SheetTitle className="line-clamp-2 text-[19px] font-bold">
          {item.name}
        </SheetTitle>
        <SheetDescription>저장된 상품 정보</SheetDescription>
      </SheetHeader>

      <SheetBody className="space-y-4 pt-4">
        <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-paper-2">
            <SettlementItemVisual item={item} sizes="88px" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-ink-2">기록 금액</p>
            <p className="mt-1 text-[25px] leading-7 font-black tracking-[-0.035em] text-after-deep [overflow-wrap:anywhere]">
              <CurrencyText amount={lineTotal(item)} currency={currency} />
            </p>
            <p
              className={cn(
                "mt-2 text-[12px] font-bold",
                item.purchased ? "text-success-text" : "text-ink-2",
              )}
            >
              {item.purchased ? "구매 완료" : "아직 구매하지 않음"}
            </p>
          </div>
        </div>

        {giftLabels.length > 0 ? (
          <div className="flex flex-wrap gap-1.5" aria-label="선물 대상">
            {giftLabels.map((label) => (
              <span
                key={label}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-bold text-ink",
                  giftClassByLabel.get(label) ?? "bg-paper-2",
                )}
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}

        <dl className="border-y border-rule">
          <SettlementDetailRow label="구매처 메모" value={storeLabel} />
          <SettlementDetailRow label="구매 일차" value={dayLabel} />
          <SettlementDetailRow label="수량" value={`${item.quantity}개`} />
        </dl>

        {item.priceNeedsReview || item.scheduleNeedsReview ? (
          <div className="flex gap-2 rounded-xl bg-paper-2 px-3 py-3 text-[12px] leading-5 text-ink">
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-danger-text"
              aria-hidden
            />
            <p>
              {item.priceNeedsReview && item.scheduleNeedsReview
                ? "가격과 구매 일차를 확인해 주세요."
                : item.priceNeedsReview
                  ? "기록 가격을 확인해 주세요."
                  : "구매 일차를 확인해 주세요."}
            </p>
          </div>
        ) : null}
      </SheetBody>

      <SheetFooter className="flex-row">
        <Link
          href={editHref}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "min-w-0 flex-1",
          )}
        >
          <Pencil aria-hidden />
          상품 수정
        </Link>
        <Button
          type="button"
          variant="secondary"
          size="icon-lg"
          aria-label={item.favorited ? "즐겨찾기 해제" : "즐겨찾기"}
          aria-pressed={Boolean(item.favorited)}
          disabled={toggleFavorited.isPending}
          onClick={() => {
            toggleFavorited.mutate(item.id, {
              onError: () =>
                toast.error("즐겨찾기를 바꾸지 못했어요. 다시 시도해 주세요."),
            });
          }}
        >
          <Star
            className={cn("size-5", item.favorited && "fill-star text-star")}
            aria-hidden
          />
        </Button>
      </SheetFooter>
    </SheetContent>
  );
}

function SettlementDetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid min-h-12 grid-cols-[5rem_minmax(0,1fr)] items-center gap-3 border-b border-rule py-2 last:border-b-0">
      <dt className="text-[12px] font-semibold text-ink-2">{label}</dt>
      <dd className="min-w-0 text-right text-[13px] leading-5 font-semibold text-ink [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  );
}

function SettlementItemVisual({
  item,
  sizes = "(max-width: 480px) calc((100vw - 34px) / 3), 149px",
  decorative = false,
}: {
  item: ShoppingItem;
  sizes?: string;
  decorative?: boolean;
}) {
  if (!item.imageDataUrl) {
    const fallback =
      fallbackStyles[getSettlementFallbackVariant(`${item.id}|${item.name}`)];
    const FallbackIcon = fallback.Icon;

    return (
      <div
        role={decorative ? undefined : "img"}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : `${item.name} DITO 기본 이미지`}
        className={cn(
          "relative flex size-full items-center justify-center overflow-hidden",
          fallback.surface,
        )}
      >
        <span className={cn("absolute", fallback.firstMotif)} />
        <span className={cn("absolute", fallback.secondMotif)} />
        <span className="relative flex size-11 items-center justify-center rounded-xl border border-paper/65 bg-paper/48 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
          <FallbackIcon className="size-6" strokeWidth={1.6} aria-hidden />
        </span>
      </div>
    );
  }

  if (!item.imageDataUrl.startsWith("/")) {
    return (
      // User-created data/blob/remote URLs have no durable intrinsic size or
      // guaranteed Next Image host configuration.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.imageDataUrl}
        alt={decorative ? "" : `${item.name} 사진`}
        loading="lazy"
        decoding="async"
        className="size-full object-cover"
      />
    );
  }

  return (
    <Image
      src={item.imageDataUrl}
      alt={decorative ? "" : `${item.name} 사진`}
      fill
      sizes={sizes}
      className="object-cover"
    />
  );
}
