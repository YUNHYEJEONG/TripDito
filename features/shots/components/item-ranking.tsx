"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  ChevronDown,
  Minus,
  Package,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/format/currency";
import { withReturnTo } from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";
import type { ShoppingItem } from "@/features/shopping-items/schema";
import type { Trip } from "@/features/trips/schema";
import type { Shot } from "../schema";
import {
  DITTO_RECOMMENDATION,
  ITEM_RANKING_CATALOG,
  type CatalogRankedItem,
} from "../data/item-ranking-catalog";
import {
  buildItemRanking,
  ITEM_RANKING_PERIOD_OPTIONS,
  mergeItemRankingSources,
  type CatalogItemWithAccountActivity,
  type ItemRankingPeriod,
  type RankedShoppingItem,
} from "../utils/item-ranking";
import {
  DestinationFilterSheet,
  type DestinationValue,
} from "./destination-filter-sheet";

const PREVIEW_LIMIT = 10;

const RANK_ROW_BG: Record<number, string> = {
  1: "bg-star/10",
  2: "bg-paper-2",
  3: "bg-affect/5",
};

function matchesDestination(
  item: Pick<CatalogRankedItem, "city" | "country">,
  destination: DestinationValue,
) {
  if (!destination?.city) return true;
  const cityMatches =
    item.city.trim().toLocaleLowerCase("ko-KR") ===
    destination.city.trim().toLocaleLowerCase("ko-KR");
  if (!cityMatches) return false;
  return (
    item.country.trim().toLocaleLowerCase("ko-KR") ===
    destination.country.trim().toLocaleLowerCase("ko-KR")
  );
}

function RankDelta({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="text-[11px] font-semibold text-affect">NEW</span>;
  }
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-ink-2">
        <Minus className="size-3" aria-hidden />
        <span className="sr-only">순위 변동 없음</span>
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-affect">
        <TrendingUp className="size-3" aria-hidden />
        <span className="sr-only">순위 상승</span>
        {delta}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-accent-text">
      <TrendingDown className="size-3" aria-hidden />
      <span className="sr-only">순위 하락</span>
      {Math.abs(delta)}
    </span>
  );
}

function AccountActivityRow({
  item,
  returnTo,
}: {
  item: RankedShoppingItem;
  returnTo: string;
}) {
  return (
    <li className="border-b border-rule last:border-b-0">
      <Link
        href={withReturnTo(`/trips/${item.tripId}`, returnTo)}
        aria-label={`${item.name}, 내 리스트 저장 ${item.listCount}회, 때샷 연결 ${item.shotCount}회`}
        className="flex min-h-[76px] items-center gap-3 px-3 py-3 outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
      >
        <span className="flex w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 py-1 text-[10px] font-bold text-accent-text">
          MY
        </span>
        <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-paper-3 text-ink-2">
          {item.imageDataUrl ? (
            <Image
              src={item.imageDataUrl}
              alt=""
              fill
              unoptimized={
                item.imageDataUrl.startsWith("data:") ||
                item.imageDataUrl.startsWith("blob:")
              }
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <Package className="size-5" aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-ink">
            {item.name}
          </span>
          {item.localName ? (
            <span className="block truncate text-[11px] text-ink-2">
              {item.localName}
            </span>
          ) : null}
          <span className="mt-0.5 block truncate text-[12px] text-ink-2">
            {item.country} · {item.city} · {item.estimatedPrice > 0
              ? formatCurrency(item.estimatedPrice, item.currency)
              : "가격 미입력"}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[13px] font-bold text-ink tabular-nums">
            {item.activityCount}회
          </span>
          <span className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-ink-2">
            <Package className="size-3" aria-hidden />
            {item.listCount}
            <Camera className="ml-0.5 size-3" aria-hidden />
            {item.shotCount}
          </span>
        </span>
      </Link>
    </li>
  );
}

function CatalogRankedRow({
  item,
  showTopBorder,
}: {
  item: CatalogItemWithAccountActivity;
  showTopBorder: boolean;
}) {
  return (
    <li
      className={cn(
        "flex min-h-[76px] items-center gap-3 px-3 py-3",
        showTopBorder && "border-t border-rule",
        RANK_ROW_BG[item.rank],
      )}
    >
      <div className="flex w-9 shrink-0 flex-col items-center gap-0.5">
        <span
          className={cn(
            "text-[16px] leading-none font-bold tabular-nums",
            item.rank <= 3 ? "text-affect" : "text-ink",
          )}
        >
          {item.rank}
          <span className="sr-only">위</span>
        </span>
        <RankDelta delta={item.delta} />
      </div>

      <div
        className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: item.tone }}
      >
        <Image
          src={item.imageSrc}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-ink">
          {item.name}
        </p>
        {item.localName ? (
          <p className="truncate text-[11px] text-ink-2">{item.localName}</p>
        ) : null}
        <p className="mt-0.5 truncate text-[12px] text-ink-2">
          {item.country} · {item.city}
          <span className="mx-1 text-ink-3">·</span>
          {item.priceLabel}
        </p>
        {item.accountActivityCount > 0 ? (
          <p className="mt-1 text-[10px] font-semibold text-accent-text">
            내 기록 {item.accountActivityCount}회 반영
          </p>
        ) : null}
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[12px] font-semibold text-ink tabular-nums">
          {item.packCount.toLocaleString("ko-KR")}
        </p>
        <p className="text-[10px] text-ink-2">담은 수</p>
      </div>
    </li>
  );
}

function DittoRecommendedRow({ showTopBorder }: { showTopBorder: boolean }) {
  const item = DITTO_RECOMMENDATION;
  return (
    <li
      aria-label={`디토추천 샘플, ${item.name}`}
      className={cn(
        "flex min-h-[76px] items-center gap-3 bg-accent/5 px-3 py-3",
        showTopBorder && "border-t border-accent/20",
      )}
    >
        <span className="flex w-9 shrink-0 flex-col items-center gap-0.5">
          <span className="flex size-7 items-center justify-center rounded-full bg-accent/15 text-accent-text">
            <Sparkles className="size-3.5" aria-hidden />
          </span>
          <span className="text-[10px] font-semibold text-accent-text">AD</span>
        </span>
        <span
          className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
          style={{ backgroundColor: item.tone }}
        >
          <Image
            src={item.imageSrc}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-0.5 inline-flex items-center gap-0.5 rounded-md bg-accent-text px-1.5 py-0.5 text-[10px] leading-none font-bold text-paper">
            <Sparkles className="size-2.5" aria-hidden />
            디토추천
          </span>
          <span className="block truncate text-[14px] font-semibold text-ink">
            {item.name}
          </span>
          <span className="block truncate text-[11px] text-ink-2">
            {item.localName}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-ink-2">
            {item.country} · {item.city}
            <span className="mx-1 text-ink-3">·</span>
            {item.priceLabel}
          </span>
        </span>
        <span className="shrink-0 text-[11px] font-semibold text-accent-text">
          추천 샘플
        </span>
    </li>
  );
}

type CatalogRow =
  | { kind: "rank"; item: CatalogItemWithAccountActivity }
  | { kind: "ditto"; id: string };

function buildCatalogRows(
  items: CatalogItemWithAccountActivity[],
): CatalogRow[] {
  const rows: CatalogRow[] = [];
  for (const item of items) {
    rows.push({ kind: "rank", item });
    if (item.rank === 3) rows.push({ kind: "ditto", id: "ditto-ad" });
  }
  return rows;
}

export function ItemRanking({
  items,
  trips,
  shots,
  period,
  destination,
  destinations,
  onPeriodChange,
  onDestinationChange,
}: {
  items: ShoppingItem[];
  trips: Trip[];
  shots: Shot[];
  period: ItemRankingPeriod;
  destination: DestinationValue;
  destinations: ReadonlyArray<{ city: string; country: string }>;
  onPeriodChange: (period: ItemRankingPeriod) => void;
  onDestinationChange: (destination: DestinationValue) => void;
}) {
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [rankingNow] = useState(() => new Date());
  const accountRanking = useMemo(
    () =>
      buildItemRanking({
        items,
        trips,
        shots,
        period,
        destination,
        now: rankingNow,
      }),
    [destination, items, period, rankingNow, shots, trips],
  );
  const catalogRanking = useMemo(
    () =>
      ITEM_RANKING_CATALOG[period]
        .filter((item) => matchesDestination(item, destination))
        .map((item, index) => ({ ...item, rank: index + 1 })),
    [destination, period],
  );
  const merged = useMemo(
    () => mergeItemRankingSources(accountRanking, catalogRanking),
    [accountRanking, catalogRanking],
  );
  const visibleCatalog = expanded
    ? merged.catalog
    : merged.catalog.slice(0, PREVIEW_LIMIT);
  const rows = buildCatalogRows(visibleCatalog);
  const remaining = Math.max(0, merged.catalog.length - PREVIEW_LIMIT);
  const periodOption =
    ITEM_RANKING_PERIOD_OPTIONS.find((option) => option.id === period) ??
    ITEM_RANKING_PERIOD_OPTIONS[0];
  const returnParams = new URLSearchParams({ tab: "ranking" });
  if (period !== "realtime") returnParams.set("period", period);
  if (destination) {
    returnParams.set("city", destination.city);
    returnParams.set("country", destination.country);
  }
  const rankingReturnTo = `/shots?${returnParams.toString()}`;

  return (
    <section
      aria-labelledby="item-ranking-title"
      className="mx-auto flex w-full max-w-[480px] flex-col gap-3 px-4 pt-4 pb-8"
    >
      <div>
        <h2 id="item-ranking-title" className="text-[18px] font-bold text-ink">
          많이 담은 잇템
        </h2>
        <p className="mt-1 text-[12px] leading-5 text-ink-2">
          운영판 목업을 복원한 샘플 순위이며 실제 사용자 통계는 아니에요. 내
          계정의 {periodOption.description} 기록은 별도로 표시해요.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={destinationOpen}
          onClick={() => setDestinationOpen(true)}
          className={cn(
            "inline-flex h-11 shrink-0 items-center gap-1 rounded-full border px-3 text-[13px] font-semibold outline-none transition-colors duration-120 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
            destination
              ? "border-affect bg-affect/10 text-affect"
              : "border-rule bg-paper text-ink hover:bg-paper-2 active:bg-paper-3",
          )}
        >
          {destination?.city ?? "여행지"}
          <ChevronDown className="size-3.5" aria-hidden />
        </button>

        <div role="tablist" aria-label="랭킹 기간" className="flex gap-2">
          {ITEM_RANKING_PERIOD_OPTIONS.map((option) => {
            const selected = option.id === period;
            return (
              <button
                key={option.id}
                id={`item-ranking-tab-${option.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="item-ranking-panel"
                onClick={() => {
                  setExpanded(false);
                  onPeriodChange(option.id);
                }}
                className={cn(
                  "h-11 rounded-full border px-3 text-[13px] font-semibold outline-none transition-colors duration-120 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                  selected
                    ? "border-affect bg-affect/10 text-affect"
                    : "border-rule bg-paper text-ink hover:bg-paper-2 active:bg-paper-3",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <DestinationFilterSheet
        open={destinationOpen}
        onOpenChange={setDestinationOpen}
        value={destination}
        destinations={destinations}
        onSelect={(value) => {
          setExpanded(false);
          onDestinationChange(value);
        }}
      />

      <div
        id="item-ranking-panel"
        role="tabpanel"
        aria-labelledby={`item-ranking-tab-${period}`}
        className="flex flex-col gap-3"
      >
        {merged.accountOnly.length > 0 ? (
          <section
            aria-labelledby="account-ranking-title"
            className="overflow-hidden rounded-2xl border border-accent/20 bg-accent/5"
          >
            <div className="px-3 py-2">
              <h3
                id="account-ranking-title"
                className="text-[12px] font-bold text-accent-text"
              >
                내 기록 · {merged.accountOnly.length}개
              </h3>
            </div>
            <ol className="border-t border-accent/15 bg-paper">
              {merged.accountOnly.map((item) => (
                <AccountActivityRow
                  key={item.key}
                  item={item}
                  returnTo={rankingReturnTo}
                />
              ))}
            </ol>
          </section>
        ) : null}

        {merged.catalog.length === 0 ? (
          <p className="rounded-2xl border border-rule bg-paper px-4 py-10 text-center text-[13px] text-ink-2">
            이 여행지에 해당하는 랭킹 상품이 없어요.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-rule bg-paper">
            <div className="flex items-center justify-between gap-2 border-b border-rule px-3 py-2 text-[11px] text-ink-2">
              <span>목업 샘플 · 실제 통계 아님</span>
              <span role="status">
                {periodOption.description} · {merged.catalog.length}개
              </span>
            </div>
            <ol aria-label={`${periodOption.label} 잇템 랭킹`}>
              {rows.map((row, index) =>
                row.kind === "ditto" ? (
                  <DittoRecommendedRow
                    key={row.id}
                    showTopBorder={index > 0}
                  />
                ) : (
                  <CatalogRankedRow
                    key={row.item.id}
                    item={row.item}
                    showTopBorder={index > 0}
                  />
                ),
              )}
            </ol>
            {!expanded && remaining > 0 ? (
              <button
                type="button"
                className="flex h-11 w-full items-center justify-center border-t border-rule text-[13px] font-semibold text-ink outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
                onClick={() => setExpanded(true)}
              >
                +{remaining}개 더보기
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
