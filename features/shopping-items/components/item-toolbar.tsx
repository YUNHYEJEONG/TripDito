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
  { value: "pending", label: "미구매" },
  { value: "purchased", label: "구매완료" },
];

const SORT_OPTIONS: { value: ItemSort; label: string }[] = [
  { value: "createdAt_desc", label: "최신순" },
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
    <div className="flex flex-col gap-3">
      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder="상품명·메모 검색"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onFilterChange(item.value)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-colors",
                filter === item.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Select
          items={SORT_OPTIONS}
          value={sort}
          onValueChange={(value) => {
            if (value) onSortChange(value as ItemSort);
          }}
        >
          <SelectTrigger
            size="sm"
            className="min-w-[7.5rem] px-2.5 font-medium focus-visible:border-ring focus-visible:ring-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" className="min-w-[9rem]">
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
