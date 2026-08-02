"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Minus, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { SeeMoreButton } from "@/components/common/see-more-control";
import {
  ITEM_RANKING_PERIOD_OPTIONS,
  MOCK_DITTO_RECOMMENDED,
  MOCK_ITEM_RANKINGS,
  type ItemRankingPeriod,
  type MockRankedItem,
} from "@/features/shots/data/mock-item-ranking";
import {
  DestinationFilterSheet,
  type DestinationValue,
} from "@/features/shots/components/destination-filter-sheet";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 10;

const RANK_ROW_BG: Record<number, string> = {
  1: "bg-[#FFF8E1]",
  2: "bg-[#F3F5F7]",
  3: "bg-[#FFF1E8]",
};

function RankDelta({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="text-[11px] font-semibold text-[#E03131]">NEW</span>
    );
  }
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
        <Minus className="size-3" aria-hidden />
        —
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#E03131]">
        <TrendingUp className="size-3" aria-hidden />
        {delta}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#3182F6]">
      <TrendingDown className="size-3" aria-hidden />
      {Math.abs(delta)}
    </span>
  );
}

function filterByDestination(
  items: MockRankedItem[],
  destination: DestinationValue,
): MockRankedItem[] {
  if (!destination?.city) return items;
  const city = destination.city.trim().toLowerCase();
  const country = destination.country?.trim().toLowerCase();
  return items.filter((item) => {
    const cityMatch = item.city.trim().toLowerCase() === city;
    if (!country) return cityMatch;
    return cityMatch && item.country.trim().toLowerCase() === country;
  });
}

type RankListRow =
  | { kind: "rank"; item: MockRankedItem }
  | { kind: "ditto"; item: MockRankedItem };

function buildRows(ranked: MockRankedItem[]): RankListRow[] {
  const rows: RankListRow[] = [];
  for (const item of ranked) {
    rows.push({ kind: "rank", item });
    if (item.rank === 3) {
      rows.push({ kind: "ditto", item: MOCK_DITTO_RECOMMENDED });
    }
  }
  return rows;
}

function RankedRow({
  item,
  showTopBorder,
}: {
  item: MockRankedItem;
  showTopBorder: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-3 py-3",
        showTopBorder && "border-t border-border/80",
        RANK_ROW_BG[item.rank],
      )}
    >
      <div className="flex w-9 shrink-0 flex-col items-center gap-0.5">
        <span
          className={cn(
            "text-[16px] font-bold tabular-nums leading-none",
            item.rank <= 3 ? "text-[#E03131]" : "text-foreground",
          )}
        >
          {item.rank}
        </span>
        <RankDelta delta={item.delta} />
      </div>

      <div
        className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: item.tone }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageSrc}
          alt=""
          className="size-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-foreground">
          {item.name}
        </p>
        {item.localName ? (
          <p className="truncate text-[11px] text-muted-foreground">
            {item.localName}
          </p>
        ) : null}
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {item.country} · {item.city}
          <span className="mx-1 text-[#CFD4DA]">·</span>
          {item.priceLabel}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[12px] font-semibold tabular-nums text-foreground">
          {item.packCount.toLocaleString("ko-KR")}
        </p>
        <p className="text-[10px] text-muted-foreground">담은 수</p>
      </div>
    </li>
  );
}

function DittoRecommendedRow({
  item,
  showTopBorder,
}: {
  item: MockRankedItem;
  showTopBorder: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 bg-[#F0F6FF] px-3 py-3",
        showTopBorder && "border-t border-[#D6E6FF]",
      )}
    >
      <div className="flex w-9 shrink-0 flex-col items-center gap-0.5">
        <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="size-3.5" aria-hidden />
        </span>
        <span className="text-[10px] font-semibold text-primary">AD</span>
      </div>

      <div
        className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: item.tone }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageSrc}
          alt=""
          className="size-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
            <Sparkles className="size-2.5" aria-hidden />
            디토추천
          </span>
        </div>
        <p className="truncate text-[14px] font-semibold text-foreground">
          {item.name}
        </p>
        {item.localName ? (
          <p className="truncate text-[11px] text-muted-foreground">
            {item.localName}
          </p>
        ) : null}
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {item.country} · {item.city}
          <span className="mx-1 text-[#CFD4DA]">·</span>
          {item.priceLabel}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[11px] font-semibold text-primary">보러가기</p>
      </div>
    </li>
  );
}

/** 잇템 랭킹 목업 — 실시간/주간/월간 1~20 */
export function ItemRankingMock() {
  const [period, setPeriod] = useState<ItemRankingPeriod>("realtime");
  const [destination, setDestination] = useState<DestinationValue>(null);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const items = useMemo(() => {
    const base = MOCK_ITEM_RANKINGS[period];
    const filtered = filterByDestination(base, destination);
    return filtered.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [period, destination]);

  const visibleRanked = expanded ? items : items.slice(0, PREVIEW_LIMIT);
  const rows = buildRows(visibleRanked);
  const remaining = items.length - PREVIEW_LIMIT;

  return (
    <div className="flex flex-col gap-3 px-4 pt-3 pb-8 sm:px-5 md:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-bold text-foreground">
            많이 담은 잇템
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            여행자들이 쇼핑리스트에 담은 상품 순위예요. (목업)
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setDestinationOpen(true)}
          className={cn(
            "inline-flex shrink-0 items-center gap-0.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
            destination
              ? "border-[#E03131] bg-[#E03131]/10 text-[#E03131]"
              : "border-[#E5E8EB] bg-background text-foreground hover:bg-[#F2F4F6]",
          )}
        >
          {destination ? destination.city : "여행지"}
          <ChevronDown className="size-3.5 opacity-70" />
        </button>

        <div
          role="tablist"
          aria-label="랭킹 기간"
          className="flex items-center gap-1.5"
        >
          {ITEM_RANKING_PERIOD_OPTIONS.map((option) => {
            const active = period === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setPeriod(option.id);
                  setExpanded(false);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                  active
                    ? "border-[#E03131] bg-[#E03131]/10 text-[#E03131]"
                    : "border-[#E5E8EB] bg-background text-foreground hover:bg-[#F2F4F6]",
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
        onSelect={(value) => {
          setDestination(value);
          setExpanded(false);
        }}
      />

      {items.length === 0 ? (
        <p className="rounded-2xl border border-border/80 bg-background px-4 py-10 text-center text-[13px] text-muted-foreground">
          이 여행지에 해당하는 랭킹 상품이 없어요.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-background">
          <ol>
            {rows.map((row, index) =>
              row.kind === "ditto" ? (
                <DittoRecommendedRow
                  key={row.item.id}
                  item={row.item}
                  showTopBorder={index > 0}
                />
              ) : (
                <RankedRow
                  key={row.item.id}
                  item={row.item}
                  showTopBorder={index > 0}
                />
              ),
            )}
          </ol>
          {!expanded && remaining > 0 ? (
            <SeeMoreButton onClick={() => setExpanded(true)}>
              +{remaining}개 더보기
            </SeeMoreButton>
          ) : null}
        </div>
      )}
    </div>
  );
}
