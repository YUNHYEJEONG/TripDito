"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHOT_SORT_OPTIONS } from "../constants";
import type { Shot, ShotSort } from "../schema";
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
}) {
  const [internalDestOpen, setInternalDestOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const destOpen = destinationOpen ?? internalDestOpen;
  const setDestOpen = onDestinationOpenChange ?? setInternalDestOpen;

  const hot = useMemo(() => getHotDestinations(shots, 5), [shots]);

  return (
    <div className="sticky top-12 z-10 -mx-4 border-b border-[#EAEDED] bg-canvas/95 px-4 pt-0.5 pb-1.5 backdrop-blur-md sm:-mx-5 sm:px-5 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip
          active={Boolean(sheetDestination)}
          onClick={() => setDestOpen(true)}
        >
          {sheetDestination ? sheetDestination.city : "여행지"}
          <ChevronDown className="size-3.5 opacity-70" />
        </FilterChip>

        <FilterChip
          active={sort !== "newest"}
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
              active={active}
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
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full border px-2.5 py-1 text-[13px] font-medium leading-none whitespace-nowrap transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-[#E5E8EB] bg-background text-foreground",
      )}
    >
      {children}
    </button>
  );
}
