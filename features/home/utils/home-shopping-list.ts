import type { ShoppingItem } from "@/features/shopping-items/types";

export type HomePurchaseFilter = "all" | "pending" | "purchased";

export function filterHomePurchaseItems(
  items: ShoppingItem[],
  filter: HomePurchaseFilter,
) {
  if (filter === "pending") return items.filter((item) => !item.purchased);
  if (filter === "purchased") return items.filter((item) => item.purchased);
  return items;
}

/** 홈에서는 모든 여행 상태를 같은 개수로 접고, 사용자가 명시적으로 펼친다. */
export function getHomeShoppingPreview(
  items: ShoppingItem[],
  limit: number,
  expanded = false,
) {
  return expanded ? items : items.slice(0, Math.max(0, limit));
}
