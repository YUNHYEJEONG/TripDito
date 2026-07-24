import type { ShoppingItem } from "@/features/shopping-items/types";

export type BudgetSummary = {
  tripBudget: number;
  estimatedTotal: number;
  purchasedTotal: number;
  remainingBudget: number;
  purchaseProgress: number;
  totalCount: number;
  purchasedCount: number;
};

export function lineTotal(item: Pick<ShoppingItem, "estimatedPrice" | "quantity">) {
  return item.estimatedPrice * item.quantity;
}

export function calculateBudget(
  tripBudget: number,
  items: ShoppingItem[],
): BudgetSummary {
  const totalCount = items.length;
  const purchasedCount = items.filter((item) => item.purchased).length;
  const estimatedTotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const purchasedTotal = items
    .filter((item) => item.purchased)
    .reduce((sum, item) => sum + lineTotal(item), 0);

  return {
    tripBudget,
    estimatedTotal,
    purchasedTotal,
    remainingBudget: tripBudget - purchasedTotal,
    purchaseProgress: totalCount === 0 ? 0 : purchasedCount / totalCount,
    totalCount,
    purchasedCount,
  };
}
