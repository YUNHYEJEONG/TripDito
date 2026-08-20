import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BudgetSummary } from "../features/budget/utils/calculate-budget";
import {
  getSettlementBudgetViewModel,
  getSettlementFallbackVariant,
  getSettlementGaugeProgress,
  getSettlementGiftLabels,
  getSettlementPurchaseDayLabel,
} from "../features/trips/utils/trip-settlement";
import { getSafeReturnTo, withReturnTo } from "../lib/navigation/return-to";

function summary(tripBudget: number, purchasedTotal: number): BudgetSummary {
  return {
    tripBudget,
    purchasedTotal,
    remainingBudget: tripBudget - purchasedTotal,
    estimatedTotal: purchasedTotal,
    purchaseProgress: 1,
    totalCount: 2,
    purchasedCount: 2,
  };
}

describe("trip settlement budget", () => {
  it("keeps an unknown budget separate from the recorded amount", () => {
    assert.deepEqual(getSettlementBudgetViewModel(summary(0, 740), "unknown"), {
      state: "unknown",
      budgetAmount: null,
      recordedAmount: 740,
      remainingAmount: null,
      balanceLabel: "남음",
      balanceAmount: null,
      balanceDanger: false,
    });
  });

  it("keeps an explicit zero budget distinct from an unknown budget", () => {
    const view = getSettlementBudgetViewModel(summary(0, 740), "input");

    assert.equal(view.state, "zero");
    assert.equal(view.budgetAmount, 0);
    assert.equal(view.recordedAmount, 740);
    assert.equal(view.remainingAmount, -740);
    assert.equal(view.balanceLabel, "초과");
    assert.equal(view.balanceAmount, 740);
    assert.equal(view.balanceDanger, true);
  });

  it("reports exact remaining and overspend amounts beside the usage gauge", () => {
    const within = getSettlementBudgetViewModel(
      summary(18_000, 12_900),
      "input",
    );
    const overspent = getSettlementBudgetViewModel(
      summary(10_000, 12_900),
      "input",
    );

    assert.equal(within.state, "within-budget");
    assert.equal(within.recordedAmount, 12_900);
    assert.equal(within.remainingAmount, 5_100);
    assert.equal(overspent.state, "overspent");
    assert.equal(overspent.remainingAmount, -2_900);
    assert.equal(overspent.balanceLabel, "초과");
    assert.equal(overspent.balanceAmount, 2_900);
    assert.equal("drainPercent" in within, false);
  });
});

describe("trip settlement suitcase gauge", () => {
  it("does not invent a ratio when there are no saved products", () => {
    assert.deepEqual(getSettlementGaugeProgress(0, 0), {
      rawPercent: null,
      visualPercent: 0,
    });
    assert.deepEqual(getSettlementGaugeProgress(3, Number.NaN), {
      rawPercent: null,
      visualPercent: 0,
    });
    assert.deepEqual(getSettlementGaugeProgress(-1, 5), {
      rawPercent: 0,
      visualPercent: 0,
    });
  });

  it("fills the suitcase by the exact purchased-to-total ratio", () => {
    assert.deepEqual(getSettlementGaugeProgress(1, 100), {
      rawPercent: 1,
      visualPercent: 1,
    });
    assert.deepEqual(getSettlementGaugeProgress(50, 100), {
      rawPercent: 50,
      visualPercent: 50,
    });

    const oneSixth = getSettlementGaugeProgress(1, 6);
    assert.ok(
      oneSixth.rawPercent !== null &&
        Math.abs(oneSixth.rawPercent - 100 / 6) < 1e-9,
    );
    assert.ok(Math.abs(oneSixth.visualPercent - 100 / 6) < 1e-9);
  });

  it("fills completely when every product is checked", () => {
    assert.deepEqual(getSettlementGaugeProgress(5, 5), {
      rawPercent: 100,
      visualPercent: 100,
    });
    assert.deepEqual(getSettlementGaugeProgress(125, 100), {
      rawPercent: 100,
      visualPercent: 100,
    });
  });
});

describe("trip settlement product records", () => {
  it("prefers named recipients and falls back to saved gift categories", () => {
    assert.deepEqual(
      getSettlementGiftLabels({
        giftTags: ["friend"],
        giftRecipients: ["민지", " 민지 ", "엄마"],
      }),
      ["민지", "엄마"],
    );
    assert.deepEqual(
      getSettlementGiftLabels({
        giftTags: ["acquaintance", "colleague", "friend"],
      }),
      ["지인", "동료", "친구"],
    );
  });

  it("gives image-less products stable branded fallback variations", () => {
    const keys = ["펑리수", "우롱차", "다리 치약", "누가 크래커", "자수 가방"];
    const first = keys.map(getSettlementFallbackVariant);

    assert.deepEqual(keys.map(getSettlementFallbackVariant), first);
    assert.ok(new Set(first).size >= 3);
    assert.ok(first.every((variant) => variant >= 0 && variant <= 3));
  });

  it("prefers the Korea purchase day and labels planned-only dates", () => {
    assert.equal(
      getSettlementPurchaseDayLabel(
        {
          purchasedAt: "2026-08-10T15:30:00.000Z",
          plannedPurchaseDate: "2026-08-10",
        },
        "2026-08-10",
        "2026-08-13",
      ),
      "2일차",
    );
    assert.equal(
      getSettlementPurchaseDayLabel(
        {
          purchasedAt: null,
          plannedPurchaseDates: ["2026-08-10", "2026-08-12"],
        },
        "2026-08-10",
        "2026-08-13",
      ),
      "예정 1일차, 3일차",
    );
  });

  it("returns from item edit to the trip before preserving its outer origin", () => {
    const editHref = withReturnTo(
      "/trips/taipei/items/pineapple/edit",
      "/passport",
    );
    const editReturnTo = getSafeReturnTo(
      new URL(editHref, "https://tripdito.local").searchParams.get("returnTo"),
    );

    assert.equal(
      withReturnTo("/trips/taipei", editReturnTo),
      "/trips/taipei?returnTo=%2Fpassport",
    );
  });
});
