import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateBudget,
  lineTotal,
} from "../features/budget/utils/calculate-budget";
import {
  filterItems,
  sortItems,
} from "../features/shopping-items/utils/item-query";
import type { ShoppingItem } from "../features/shopping-items/types";

function item(
  partial: Partial<ShoppingItem> & Pick<ShoppingItem, "id" | "name">,
): ShoppingItem {
  return {
    tripId: "t1",
    estimatedPrice: 1000,
    quantity: 1,
    memo: "",
    imageDataUrl: null,
    plannedPurchaseDate: null,
    giftTags: [],
    purchased: false,
    purchasedAt: null,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("calculateBudget", () => {
  it("aggregates estimated, purchased, remaining, progress", () => {
    const items = [
      item({ id: "1", name: "A", estimatedPrice: 1000, quantity: 2 }),
      item({
        id: "2",
        name: "B",
        estimatedPrice: 500,
        quantity: 1,
        purchased: true,
      }),
    ];
    const summary = calculateBudget(10000, items);
    assert.equal(lineTotal(items[0]), 2000);
    assert.equal(summary.estimatedTotal, 2500);
    assert.equal(summary.purchasedTotal, 500);
    assert.equal(summary.remainingBudget, 9500);
    assert.equal(summary.purchaseProgress, 0.5);
    assert.equal(summary.totalCount, 2);
    assert.equal(summary.purchasedCount, 1);
  });
});

describe("filterItems / sortItems", () => {
  const items = [
    item({
      id: "1",
      name: "파우치",
      memo: "선물",
      estimatedPrice: 1500,
      createdAt: "2026-01-03T00:00:00.000Z",
    }),
    item({
      id: "2",
      name: "비타민",
      estimatedPrice: 980,
      purchased: true,
      createdAt: "2026-01-02T00:00:00.000Z",
    }),
    item({
      id: "3",
      name: "스낵",
      estimatedPrice: 2000,
      quantity: 2,
      createdAt: "2026-01-01T00:00:00.000Z",
    }),
  ];

  it("filters by purchase state and query", () => {
    assert.equal(filterItems(items, "pending", "").length, 2);
    assert.equal(filterItems(items, "purchased", "").length, 1);
    assert.equal(filterItems(items, "all", "선물")[0]?.id, "1");
    assert.equal(filterItems(items, "all", "비타")[0]?.id, "2");
  });

  it("filters gifts and searches production metadata", () => {
    const rich = [
      item({
        id: "meta",
        name: "초콜릿",
        giftTags: ["friend"],
        localName: "抹茶チョコレート",
        expectedStores: ["돈키호테 시부야점"],
      }),
    ];
    assert.equal(filterItems(rich, "gift", "")[0]?.id, "meta");
    assert.equal(filterItems(rich, "all", "抹茶")[0]?.id, "meta");
    assert.equal(filterItems(rich, "all", "시부야")[0]?.id, "meta");
  });

  it("sorts by price and createdAt", () => {
    assert.deepEqual(
      sortItems(items, "price_desc").map((row) => row.id),
      ["3", "1", "2"],
    );
    assert.deepEqual(
      sortItems(items, "createdAt_desc").map((row) => row.id),
      ["1", "2", "3"],
    );
  });

  it("sorts multi-day items by their first canonical purchase date", () => {
    const scheduled = [
      item({
        id: "late",
        name: "B",
        plannedPurchaseDates: ["2026-03-04"],
      }),
      item({
        id: "early",
        name: "A",
        plannedPurchaseDates: ["2026-03-03", "2026-03-05"],
      }),
    ];
    assert.deepEqual(
      sortItems(scheduled, "day_asc").map((row) => row.id),
      ["early", "late"],
    );
  });
});
