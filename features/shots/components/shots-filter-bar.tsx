"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHOT_SORT_OPTIONS } from "../constants";
import type { Shot, ShotSort } from "../schema";
import { useMouseDragScroll } from "../hooks/use-mouse-drag-scroll";
import { getHotDestinations } from "../utils/shot-query";
import {
  DestinationFilterSheet,
  type DestinationValue,
} from "./destination-filter-sheet";
import { SortFilterSheet } from "./sort-filter-sheet";

export function ShotsFilterBar({
  shots,
  sheetDestination,
  hotDestination,
  sort,
  onSheetDestinationChange,
  onHotDestinationChange,
  onSortChange,
  destinationOpen,
  onDestinationOpenChange,
  destinations,
}: {
  shots: Shot[];
  /** 여행지 Sheet로 선택한 값 — 인기 칩과 분리 */
  sheetDestination: DestinationValue;
  /** 인기 여행지 칩으로 선택한 값 */
  hotDestination: DestinationValue;
  sort: ShotSort;
  onSheetDestinationChange: (value: DestinationValue) => void;
  onHotDestinationChange: (value: DestinationValue) => void;
  onSortChange: (value: ShotSort) => void;
  destinationOpen?: boolean;
  onDestinationOpenChange?: (open: boolean) => void;
  destinations?: ReadonlyArray<{ city: string; country: string }>;
}) {
  const [internalDestOpen, setInternalDestOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const destOpen = destinationOpen ?? internalDestOpen;
  const setDestOpen = onDestinationOpenChange ?? setInternalDestOpen;

  const hot = useMemo(() => getHotDestinations(shots, 5), [shots]);

  useMouseDragScroll(scrollerRef, true, { snap: false, wheel: true });

  return (
    <div className="sticky top-[calc(env(safe-area-inset-top)+3rem)] z-20 -mx-4 bg-paper px-4 py-2">
      <div
        ref={scrollerRef}
        className={cn(
          "flex min-w-0 touch-auto items-center gap-2 overflow-x-auto overscroll-x-contain py-1",
          "cursor-grab [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        <FilterChip
          scrollerRef={scrollerRef}
          active={Boolean(sheetDestination)}
          popup="dialog"
          expanded={destOpen}
          onClick={() => setDestOpen(true)}
        >
          {sheetDestination ? sheetDestination.city : "여행지"}
          <ChevronDown className="size-3.5 opacity-70" />
        </FilterChip>

        <FilterChip
          scrollerRef={scrollerRef}
          active={sort !== "newest"}
          popup="dialog"
          expanded={sortOpen}
          onClick={() => setSortOpen(true)}
        >
          {SHOT_SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "정렬"}
          <ChevronDown className="size-3.5 opacity-70" />
        </FilterChip>

        {hot.map((dest) => {
          const active =
            hotDestination?.city === dest.city &&
            hotDestination?.country === dest.country;
          return (
            <FilterChip
              key={`${dest.country}-${dest.city}`}
              scrollerRef={scrollerRef}
              active={active}
              pressed={active}
              onClick={() =>
                onHotDestinationChange(
                  active
                    ? null
                    : { city: dest.city, country: dest.country },
                )
              }
            >
              {dest.city}
            </FilterChip>
          );
        })}
      </div>

      <DestinationFilterSheet
        open={destOpen}
        onOpenChange={setDestOpen}
        value={sheetDestination}
        onSelect={onSheetDestinationChange}
        destinations={destinations}
      />
      <SortFilterSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        value={sort}
        onSelect={onSortChange}
      />
    </div>
  );
}

function FilterChip({
  children,
  active,
  pressed,
  popup,
  expanded,
  onClick,
  scrollerRef,
}: {
  children: React.ReactNode;
  active?: boolean;
  pressed?: boolean;
  popup?: "dialog";
  expanded?: boolean;
  onClick: () => void;
  scrollerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-haspopup={popup}
      aria-expanded={popup ? expanded : undefined}
      onClick={() => {
        if (scrollerRef.current?.dataset.dragMoved) return;
        onClick();
      }}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-1 rounded-full border px-3 text-[13px] font-semibold leading-none whitespace-nowrap outline-none transition-colors duration-120 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        active
          ? "border-ink bg-ink text-paper hover:bg-ink-2 active:bg-ink-2"
          : "border-rule bg-paper text-ink hover:bg-paper-2 active:bg-paper-2",
      )}
    >
      {children}
    </button>
  );
}
