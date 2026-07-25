"use client";

import type { ItemPurchaseFilter, ItemSort } from "../types";
import { SearchInput } from "@/components/common/search-input";
import { cn } from "@/lib/utils";

const FILTERS: { value: ItemPurchaseFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "pending", label: "미구매" },
  { value: "purchased", label: "구매완료" },
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
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as ItemSort)}
          className="h-8 rounded-lg border-0 bg-secondary px-2.5 text-[13px] font-medium outline-none"
        >
          <option value="createdAt_desc">최신순</option>
          <option value="price_desc">가격 높은순</option>
          <option value="price_asc">가격 낮은순</option>
          <option value="name_asc">이름순</option>
        </select>
      </div>
    </div>
  );
}
