"use client";

import type { ItemPurchaseFilter, ItemSort } from "../types";
import { SearchInput } from "@/components/common/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const FILTERS: { value: ItemPurchaseFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "pending", label: "살 것" },
  { value: "purchased", label: "산 것" },
  { value: "gift", label: "선물" },
];

const SORT_OPTIONS: { value: ItemSort; label: string }[] = [
  { value: "createdAt_desc", label: "최신순" },
  { value: "day_asc", label: "구매 일차순" },
  { value: "price_desc", label: "가격 높은순" },
  { value: "price_asc", label: "가격 낮은순" },
  { value: "name_asc", label: "이름순" },
];

export function ItemToolbar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  filter: ItemPurchaseFilter;
  onFilterChange: (value: ItemPurchaseFilter) => void;
  sort: ItemSort;
  onSortChange: (value: ItemSort) => void;
}) {
  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label="쇼핑리스트 분류"
        className="grid grid-cols-4 rounded-lg bg-paper-2 p-1"
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
                "min-h-11 rounded-md px-2 text-[14px] font-semibold whitespace-nowrap outline-none transition-colors duration-120 focus-visible:ring-2 focus-visible:ring-focus",
                active
                  ? "bg-ink text-paper hover:bg-ink-2 active:bg-ink-2"
                  : "text-ink-2 hover:bg-paper-3 hover:text-ink active:bg-paper-3 active:text-ink",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <SearchInput
          value={query}
          onChange={onQueryChange}
          placeholder="상품명·현지명·구매처 검색"
        />
        <Select
          items={SORT_OPTIONS}
          value={sort}
          onValueChange={(value) => {
            if (value) onSortChange(value as ItemSort);
          }}
        >
          <SelectTrigger
            size="sm"
            className="min-w-[7.75rem] max-w-[9.5rem] px-3 font-medium"
            aria-label="쇼핑리스트 정렬"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" className="min-w-[10rem]">
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
