import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BudgetSummary } from "../features/budget/utils/calculate-budget";
import { tripRepository } from "../features/trips/data/trip-repository";
import {
  getNextSuitcaseCelebrationNonce,
  getStatusBudgetGauge,
  getStatusBudgetDisplayPercent,
  getStatusSuitcaseGauge,
  shouldCelebrateSuitcaseCompletion,
} from "../features/trips/utils/trip-status-overview";
import { storageKeys } from "../lib/storage/keys";

function summary(
  tripBudget: number,
  estimatedTotal: number,
  purchasedTotal: number,
  totalCount = 5,
  purchasedCount = 2,
): BudgetSummary {
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

describe("trip status budget gauge", () => {
  it("fills a planned budget gauge from the exact estimated-cost coverage", () => {
    assert.deepEqual(
      getStatusBudgetGauge("idle", summary(0, 3_400, 0), "unknown"),
      {
        state: "unknown",
        rawPercent: null,
        visualPercent: 0,
        budgetAmount: null,
        comparisonAmount: 3_400,
        remainingAmount: null,
      },
    );

    const under = getStatusBudgetGauge(
      "prep",
      summary(7_500, 10_000, 0),
      "input",
    );
    assert.equal(under?.rawPercent, 75);
    assert.equal(under?.visualPercent, 75);
    assert.equal(under?.state, "overspent");
    assert.equal(under?.remainingAmount, -2_500);

    const exact = getStatusBudgetGauge(
      "prep",
      summary(10_000, 10_000, 0),
      "input",
    );
    assert.equal(exact?.rawPercent, 100);
    assert.equal(exact?.visualPercent, 100);
    assert.equal(exact?.state, "within-budget");

    const over = getStatusBudgetGauge(
      "prep",
      summary(15_000, 10_000, 0),
      "input",
    );
    assert.equal(over?.rawPercent, 150);
    assert.equal(over?.visualPercent, 100);
    assert.equal(over?.state, "within-budget");
    assert.equal(over?.remainingAmount, 5_000);

    const explicitZero = getStatusBudgetGauge(
      "prep",
      summary(0, 0, 0),
      "input",
    );
    assert.equal(explicitZero?.state, "zero");
    assert.equal(explicitZero?.rawPercent, null);
    assert.equal(explicitZero?.visualPercent, 100);
    assert.equal(explicitZero?.remainingAmount, 0);

    const zeroBudgetOverspent = getStatusBudgetGauge(
      "prep",
      summary(0, 3_400, 0),
      "input",
    );
    assert.equal(zeroBudgetOverspent?.state, "overspent");
    assert.equal(zeroBudgetOverspent?.rawPercent, 0);
    assert.equal(zeroBudgetOverspent?.visualPercent, 0);
    assert.equal(zeroBudgetOverspent?.remainingAmount, -3_400);
  });

  it("never rounds an underfunded planned budget up to 100 percent", () => {
    const almostFunded = getStatusBudgetGauge(
      "prep",
      summary(14_090, 14_160, 0),
      "input",
    );
    const exact = getStatusBudgetGauge(
      "prep",
      summary(14_160, 14_160, 0),
      "input",
    );
    const over = getStatusBudgetGauge(
      "prep",
      summary(20_000, 14_160, 0),
      "input",
    );

    assert.ok(almostFunded);
    assert.equal(getStatusBudgetDisplayPercent(almostFunded), 99.5);
    assert.equal(almostFunded.remainingAmount, -70);
    assert.ok(exact);
    assert.equal(getStatusBudgetDisplayPercent(exact), 100);
    assert.ok(over);
    assert.equal(getStatusBudgetDisplayPercent(over), 100);
    assert.equal(
      getStatusBudgetDisplayPercent({ rawPercent: null, visualPercent: 100 }),
      0,
    );
  });

  it("does not invent a denominator when a planned trip has no estimated cost", () => {
    const zero = getStatusBudgetGauge(
      "prep",
      summary(0, 0, 0),
      "input",
    );
    const funded = getStatusBudgetGauge(
      "idle",
      summary(20_000, 0, 0),
      undefined,
    );

    assert.equal(zero?.rawPercent, null);
    assert.equal(zero?.visualPercent, 100);
    assert.equal(zero?.state, "zero");
    assert.equal(funded?.rawPercent, null);
    assert.equal(funded?.visualPercent, 100);
    assert.equal(funded?.state, "within-budget");
  });

  it("drains the live gauge from the exact remaining-budget ratio", () => {
    const start = getStatusBudgetGauge(
      "live",
      summary(10_000, 8_000, 0),
      "input",
    );
    const checked = getStatusBudgetGauge(
      "live",
      summary(10_000, 8_000, 4_000),
      "input",
    );
    const overspent = getStatusBudgetGauge(
      "live",
      summary(10_000, 12_500, 12_500),
      "input",
    );

    assert.equal(start?.rawPercent, 100);
    assert.equal(checked?.rawPercent, 60);
    assert.equal(checked?.visualPercent, 60);
    assert.equal(overspent?.rawPercent, -25);
    assert.equal(overspent?.visualPercent, 0);
    assert.equal(overspent?.state, "overspent");
  });

  it("keeps a zero live budget ratio honest while exposing recorded overspend", () => {
    const empty = getStatusBudgetGauge(
      "live",
      summary(0, 0, 0),
      "input",
    );
    const spent = getStatusBudgetGauge(
      "live",
      summary(0, 0, 700),
      "input",
    );

    assert.equal(empty?.state, "zero");
    assert.equal(empty?.rawPercent, null);
    assert.equal(empty?.visualPercent, 0);
    assert.equal(spent?.state, "overspent");
    assert.equal(spent?.rawPercent, null);
    assert.equal(spent?.visualPercent, 0);
    assert.equal(spent?.remainingAmount, -700);
  });

  it("does not fabricate live or completed ratios for unknown and empty data", () => {
    assert.equal(
      getStatusBudgetGauge("live", summary(0, 0, 700), "unknown")
        ?.rawPercent,
      null,
    );
    assert.equal(getStatusBudgetGauge("after", summary(10_000, 0, 0), "input"), null);
    assert.equal(getStatusSuitcaseGauge("live", 0, 0).rawPercent, null);
    assert.equal(getStatusSuitcaseGauge("after", Number.NaN, 4).rawPercent, null);
  });
});

describe("trip status suitcase gauge", () => {
  it("reveals deterministic planned props and reports exact overflow without a fake percent", () => {
    assert.deepEqual(getStatusSuitcaseGauge("prep", 8, 0), {
      kind: "collection",
      rawPercent: null,
      visualPercent: 0,
      activeSlots: 5,
      overflowCount: 3,
      totalCount: 8,
      purchasedCount: 0,
    });
    assert.equal(getStatusSuitcaseGauge("idle", 2, 0).activeSlots, 2);
  });

  it("fills live and completed suitcases from purchased items only", () => {
    assert.equal(getStatusSuitcaseGauge("live", 5, 2).rawPercent, 40);
    assert.equal(getStatusSuitcaseGauge("after", 5, 5).visualPercent, 100);
    assert.equal(getStatusSuitcaseGauge("after", 5, 99).purchasedCount, 5);
  });

  it("celebrates every successful incomplete-to-complete transition", () => {
    const complete = {
      mutationSucceeded: true,
      totalCountBefore: 5,
      purchasedCountBefore: 4,
      totalCountAfter: 5,
      purchasedCountAfter: 5,
      itemPurchasedBefore: false,
      itemPurchasedAfter: true,
    };

    assert.equal(shouldCelebrateSuitcaseCompletion(complete), true);

    const uncheck = {
      ...complete,
      purchasedCountBefore: 5,
      purchasedCountAfter: 4,
      itemPurchasedBefore: true,
      itemPurchasedAfter: false,
    };
    assert.equal(shouldCelebrateSuitcaseCompletion(uncheck), false);

    // The same boundary remains eligible after an uncheck, so the caller can
    // issue a new nonce for every successful re-completion.
    assert.equal(shouldCelebrateSuitcaseCompletion(complete), true);
  });

  it("issues a distinct nonce after each consumed completion", () => {
    const first = getNextSuitcaseCelebrationNonce(0);
    const second = getNextSuitcaseCelebrationNonce(first);

    assert.equal(first, 1);
    assert.equal(second, 2);
    assert.notEqual(second, first);
  });

  it("does not celebrate initial completion, refreshes, failures, or deletion-induced completion", () => {
    const finalPurchase = {
      mutationSucceeded: true,
      totalCountBefore: 5,
      purchasedCountBefore: 4,
      totalCountAfter: 5,
      purchasedCountAfter: 5,
      itemPurchasedBefore: false,
      itemPurchasedAfter: true,
    };

    assert.equal(
      shouldCelebrateSuitcaseCompletion({
        ...finalPurchase,
        purchasedCountBefore: 5,
        itemPurchasedBefore: true,
      }),
      false,
    );
    assert.equal(
      shouldCelebrateSuitcaseCompletion({
        ...finalPurchase,
        purchasedCountBefore: 5,
        itemPurchasedBefore: true,
        itemPurchasedAfter: true,
      }),
      false,
    );
    assert.equal(
      shouldCelebrateSuitcaseCompletion({
        ...finalPurchase,
        mutationSucceeded: false,
      }),
      false,
    );
    assert.equal(
      shouldCelebrateSuitcaseCompletion({
        ...finalPurchase,
        totalCountAfter: 4,
        purchasedCountAfter: 4,
      }),
      false,
    );
  });

  it("celebrates only the second of two remaining successful purchases", () => {
    const penultimatePurchase = {
      mutationSucceeded: true,
      totalCountBefore: 5,
      purchasedCountBefore: 3,
      totalCountAfter: 5,
      purchasedCountAfter: 4,
      itemPurchasedBefore: false,
      itemPurchasedAfter: true,
    };

    assert.equal(
      shouldCelebrateSuitcaseCompletion(penultimatePurchase),
      false,
    );
    assert.equal(
      shouldCelebrateSuitcaseCompletion({
        ...penultimatePurchase,
        purchasedCountBefore: 4,
        purchasedCountAfter: 5,
      }),
      true,
    );
  });

  it("rejects empty, corrupt, and non-integral completion counts", () => {
    const valid = {
      mutationSucceeded: true,
      totalCountBefore: 5,
      purchasedCountBefore: 4,
      totalCountAfter: 5,
      purchasedCountAfter: 5,
      itemPurchasedBefore: false,
      itemPurchasedAfter: true,
    };
    const invalidCases = [
      { totalCountBefore: 0, totalCountAfter: 0 },
      { totalCountBefore: -1, totalCountAfter: -1 },
      { purchasedCountBefore: 6 },
      { purchasedCountBefore: -1 },
      { totalCountBefore: 5.5, totalCountAfter: 5.5 },
      { totalCountBefore: Number.NaN, totalCountAfter: Number.NaN },
      { purchasedCountAfter: Number.POSITIVE_INFINITY },
    ];

    for (const invalid of invalidCases) {
      assert.equal(
        shouldCelebrateSuitcaseCompletion({ ...valid, ...invalid }),
        false,
      );
    }
  });
});

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

describe("trip budget-only repository update", () => {
  it("updates only budget fields without rebasing or rewriting shopping items", () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const storage = memoryStorage();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: storage },
    });

    try {
      const trip = tripRepository.create({
        name: "후쿠오카",
        country: "일본",
        city: "후쿠오카",
        startDate: "2026-08-19",
        endDate: "2026-08-22",
        currency: "JPY",
        budget: 0,
        budgetMode: "unknown",
        tripTags: ["shopping"],
      });
      const itemBytes = '[{"id":"keep-me","plannedPurchaseDate":"2026-08-20"}]';
      storage.setItem(storageKeys.items, itemBytes);

      const updated = tripRepository.updateBudget(trip.id, {
        budget: 48_000,
        budgetMode: "input",
      });
      assert.equal(updated.budget, 48_000);
      assert.equal(updated.budgetMode, "input");
      assert.equal(updated.startDate, trip.startDate);
      assert.equal(updated.endDate, trip.endDate);
      assert.equal(storage.getItem(storageKeys.items), itemBytes);

      const cleared = tripRepository.updateBudget(trip.id, {
        budget: 48_000,
        budgetMode: "unknown",
      });
      assert.equal(cleared.budget, 0);
      assert.equal(cleared.budgetMode, "unknown");
      assert.throws(
        () =>
          tripRepository.updateBudget(trip.id, {
            budget: -1,
            budgetMode: "input",
          }),
        /0 이상/,
      );
    } finally {
      if (originalWindow) {
        Object.defineProperty(globalThis, "window", originalWindow);
      } else {
        Reflect.deleteProperty(globalThis, "window");
      }
    }
  });
});
