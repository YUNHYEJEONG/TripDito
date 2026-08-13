import type {
  ItemPurchaseFilter,
  ItemSort,
  ShoppingItem,
} from "../types";
import { lineTotal } from "@/features/budget/utils/calculate-budget";
import { normalizePlannedPurchaseDates } from "./trip-day";

export function filterItems(
  items: ShoppingItem[],
  filter: ItemPurchaseFilter,
  query: string,
) {
  const normalized = query.trim().toLowerCase();
  return items.filter((item) => {
    if (filter === "pending" && item.purchased) return false;
    if (filter === "purchased" && !item.purchased) return false;
    if (filter === "gift" && item.giftTags.length === 0) return false;
    if (!normalized) return true;
    return (
      item.name.toLowerCase().includes(normalized) ||
      item.memo.toLowerCase().includes(normalized) ||
      item.localName?.toLowerCase().includes(normalized) ||
      item.expectedStores?.some((store) =>
        store.toLowerCase().includes(normalized),
      )
    );
  });
}

export function sortItems(items: ShoppingItem[], sort: ItemSort) {
  const next = [...items];
  switch (sort) {
    case "day_asc":
      return next.sort((a, b) => {
        const aDate = normalizePlannedPurchaseDates(a)[0] ?? "9999-12-31";
        const bDate = normalizePlannedPurchaseDates(b)[0] ?? "9999-12-31";
        if (aDate !== bDate) return aDate.localeCompare(bDate);
        return a.sortOrder - b.sortOrder;
      });
    case "price_desc":
      return next.sort((a, b) => lineTotal(b) - lineTotal(a));
    case "price_asc":
      return next.sort((a, b) => lineTotal(a) - lineTotal(b));
    case "name_asc":
      return next.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    case "createdAt_desc":
    default:
      return next.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}
