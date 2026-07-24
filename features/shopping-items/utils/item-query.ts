import type {
  ItemPurchaseFilter,
  ItemSort,
  ShoppingItem,
} from "../types";
import { lineTotal } from "@/features/budget/utils/calculate-budget";

export function filterItems(
  items: ShoppingItem[],
  filter: ItemPurchaseFilter,
  query: string,
) {
  const normalized = query.trim().toLowerCase();
  return items.filter((item) => {
    if (filter === "pending" && item.purchased) return false;
    if (filter === "purchased" && !item.purchased) return false;
    if (!normalized) return true;
    return (
      item.name.toLowerCase().includes(normalized) ||
      item.memo.toLowerCase().includes(normalized)
    );
  });
}

export function sortItems(items: ShoppingItem[], sort: ItemSort) {
  const next = [...items];
  switch (sort) {
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
