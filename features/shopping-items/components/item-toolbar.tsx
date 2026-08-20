"use client";

import type { ItemPurchaseFilter, ItemSort } from "../types";
import { SearchInput } from "@/components/common/search-input";
import type { HomeMode } from "@/features/home/utils/get-home-mode";
import { cn } from "@/lib/utils";

const FILTERS: { value: ItemPurchaseFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "pending", label: "살거야" },
  { value: "purchased", label: "샀다!" },
  { value: "gift", label: "선물" },
];

const SORT_OPTIONS: {
  value: ItemSort;
  label: string;
  ariaLabel?: string;
}[] = [
  { value: "createdAt_desc", label: "최신순" },
  { value: "name_asc", label: "이름순" },
  { value: "day_asc", label: "일차순", ariaLabel: "구매 일차순" },
  { value: "price_desc", label: "가격 높은순" },
  { value: "price_asc", label: "가격 낮은순" },
];

export type ItemToolbarProps = {
  mode: HomeMode;
  query: string;
  onQueryChange: (value: string) => void;
  filter: ItemPurchaseFilter;
  onFilterChange: (value: ItemPurchaseFilter) => void;
  sort: ItemSort;
  onSortChange: (value: ItemSort) => void;
};

export function ItemToolbar({
  mode,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
}: ItemToolbarProps) {
  const showPurchaseFilters = mode === "live" || mode === "after";

  return (
    <div className="space-y-2">
      {showPurchaseFilters ? (
        <div
          role="group"
          aria-label="쇼핑리스트 분류"
          className="grid grid-cols-4 border-y border-rule"
        >
          {FILTERS.map((item) => {
            const active = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => onFilterChange(item.value)}
                className={cn(
                  "relative inline-flex min-h-11 items-center justify-center px-1 text-[13px] font-semibold whitespace-nowrap outline-none after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:bg-accent-text after:opacity-0 after:transition-[transform,opacity] after:duration-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus active:bg-paper-3 motion-reduce:after:transition-none",
                  active
                    ? "text-accent-text after:scale-x-100 after:opacity-100"
                    : "text-ink-2 hover:bg-paper-2 hover:text-ink",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder="상품명·현지명·구매처 검색"
        className="[&_[data-slot=input]]:h-11 [&_[data-slot=input]]:rounded-lg [&_[data-slot=input]]:text-[14px] [&_[data-slot=input]]:placeholder:text-[13px]"
      />

      <div
        role="group"
        aria-label="쇼핑리스트 정렬"
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SORT_OPTIONS.map((option) => {
          const active = sort === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-label={option.ariaLabel ?? option.label}
              aria-pressed={active}
              onClick={() => onSortChange(option.value)}
              className={cn(
                "inline-flex min-h-11 shrink-0 snap-start items-center justify-center rounded-lg border px-3 text-[12px] font-semibold whitespace-nowrap outline-none transition-[color,background-color,border-color,transform] duration-120 focus-visible:ring-2 focus-visible:ring-focus active:scale-[0.98] motion-reduce:transition-none",
                active
                  ? "border-accent-text bg-accent-text text-paper"
                  : "border-rule bg-paper text-ink-2 hover:border-control hover:bg-paper-2 hover:text-ink active:bg-paper-3",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
