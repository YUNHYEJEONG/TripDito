import type { BudgetSummary } from "@/features/budget/utils/calculate-budget";
import type { HomeMode } from "@/features/home/utils/get-home-mode";

export type TripStatusOverviewMode = HomeMode;

export type StatusBudgetGaugeState =
  | "unknown"
  | "zero"
  | "within-budget"
  | "overspent";

export type StatusBudgetGauge = {
  state: StatusBudgetGaugeState;
  /** Exact, uncapped ratio. `null` means that a ratio is not mathematically honest. */
  rawPercent: number | null;
  /** Capped value used only by the visual track. */
  visualPercent: number;
  budgetAmount: number | null;
  comparisonAmount: number;
  remainingAmount: number | null;
};

export type StatusSuitcaseGauge = {
  kind: "collection" | "purchase-progress";
  /** Only purchase progress has a real denominator and therefore a semantic ratio. */
  rawPercent: number | null;
  visualPercent: number;
  activeSlots: number;
  overflowCount: number;
  totalCount: number;
  purchasedCount: number;
};

export const SUITCASE_ITEM_SLOTS = 5;

export type CompletedSuitcaseArtworkVariant = "complete" | "one-missing";

function finiteNonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function finiteCount(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/**
 * Completed trips stay static, but a list with exactly one pending item uses a
 * dedicated composition with one fewer souvenir. Other incomplete counts keep
 * the neutral completed artwork until a matching approved asset exists.
 */
export function getCompletedSuitcaseArtworkVariant(
  totalCount: number,
  purchasedCount: number,
): CompletedSuitcaseArtworkVariant {
  const safeTotal = finiteCount(totalCount);
  const safePurchased = Math.min(safeTotal, finiteCount(purchasedCount));

  return safeTotal > 0 && safeTotal - safePurchased === 1
    ? "one-missing"
    : "complete";
}

/**
 * Keeps an almost-complete budget honest: values below 100 never render as
 * 100, while exact and over-funded budgets still resolve to a full track.
 */
export function getStatusBudgetDisplayPercent(
  gauge: Pick<StatusBudgetGauge, "rawPercent" | "visualPercent">,
): number {
  if (gauge.rawPercent === null || !Number.isFinite(gauge.rawPercent)) {
    return 0;
  }
  if (gauge.rawPercent >= 100) return 100;
  if (gauge.rawPercent <= 0) return 0;

  const bounded = Math.min(100, Math.max(0, gauge.visualPercent));
  return Math.floor(bounded * 10) / 10;
}

function budgetIsKnown(
  summary: BudgetSummary,
  budgetMode: "unknown" | "input" | undefined,
) {
  return (
    budgetMode === "input" ||
    (budgetMode === undefined && finiteNonNegative(summary.tripBudget) > 0)
  );
}

/**
 * Planned trips show how much of the estimated shopping cost the saved budget
 * covers. Live trips show the exact share of budget that remains, so the track
 * drains as purchased items are checked. Completed trips have no budget bar.
 */
export function getStatusBudgetGauge(
  mode: TripStatusOverviewMode,
  summary: BudgetSummary,
  budgetMode: "unknown" | "input" | undefined,
): StatusBudgetGauge | null {
  if (mode === "after") return null;

  const tripBudget = finiteNonNegative(summary.tripBudget);
  const comparisonAmount =
    mode === "live"
      ? finiteNonNegative(summary.purchasedTotal)
      : finiteNonNegative(summary.estimatedTotal);

  if (!budgetIsKnown(summary, budgetMode)) {
    return {
      state: "unknown",
      rawPercent: null,
      visualPercent: 0,
      budgetAmount: null,
      comparisonAmount,
      remainingAmount: null,
    };
  }

  if (mode === "idle" || mode === "prep") {
    if (comparisonAmount === 0) {
      return {
        state: tripBudget === 0 ? "zero" : "within-budget",
        rawPercent: null,
        visualPercent: 100,
        budgetAmount: tripBudget,
        comparisonAmount,
        remainingAmount: tripBudget,
      };
    }

    const rawPercent = (tripBudget / comparisonAmount) * 100;
    const remainingAmount = tripBudget - comparisonAmount;

    return {
      state: remainingAmount < 0 ? "overspent" : "within-budget",
      rawPercent,
      visualPercent: Math.min(100, Math.max(0, rawPercent)),
      budgetAmount: tripBudget,
      comparisonAmount,
      remainingAmount,
    };
  }

  if (tripBudget === 0) {
    return {
      state: comparisonAmount > 0 ? "overspent" : "zero",
      rawPercent: null,
      visualPercent: 0,
      budgetAmount: 0,
      comparisonAmount,
      remainingAmount: -comparisonAmount,
    };
  }

  const remainingAmount = tripBudget - comparisonAmount;
  const rawPercent = (remainingAmount / tripBudget) * 100;

  return {
    state: remainingAmount < 0 ? "overspent" : "within-budget",
    rawPercent,
    visualPercent: Math.min(100, Math.max(0, rawPercent)),
    budgetAmount: tripBudget,
    comparisonAmount,
    remainingAmount,
  };
}

/**
 * Before departure there is no honest completion denominator. Each saved item
 * lights one deterministic suitcase prop, with an exact overflow count after
 * five. Live and completed trips use the exact purchased-to-total ratio.
 */
export function getStatusSuitcaseGauge(
  mode: TripStatusOverviewMode,
  totalCount: number,
  purchasedCount: number,
): StatusSuitcaseGauge {
  const safeTotal = finiteCount(totalCount);
  const safePurchased = Math.min(safeTotal, finiteCount(purchasedCount));

  if (mode === "idle" || mode === "prep") {
    const activeSlots = Math.min(SUITCASE_ITEM_SLOTS, safeTotal);
    return {
      kind: "collection",
      rawPercent: null,
      visualPercent: 0,
      activeSlots,
      overflowCount: Math.max(0, safeTotal - SUITCASE_ITEM_SLOTS),
      totalCount: safeTotal,
      purchasedCount: safePurchased,
    };
  }

  if (safeTotal === 0) {
    return {
      kind: "purchase-progress",
      rawPercent: null,
      visualPercent: 0,
      activeSlots: 0,
      overflowCount: 0,
      totalCount: 0,
      purchasedCount: 0,
    };
  }

  const rawPercent = (safePurchased / safeTotal) * 100;
  return {
    kind: "purchase-progress",
    rawPercent,
    visualPercent: rawPercent,
    activeSlots: Math.round((rawPercent / 100) * SUITCASE_ITEM_SLOTS),
    overflowCount: 0,
    totalCount: safeTotal,
    purchasedCount: safePurchased,
  };
}

export type SuitcaseCompletionTransition = {
  mutationSucceeded: boolean;
  totalCountBefore: number;
  purchasedCountBefore: number;
  totalCountAfter: number;
  purchasedCountAfter: number;
  itemPurchasedBefore: boolean;
  itemPurchasedAfter: boolean;
};

/**
 * Keeps event identity independent from the transient active nonce. The UI may
 * consume an animation by resetting its active nonce to zero, while this
 * sequence continues to advance for the next earned completion.
 */
export function getNextSuitcaseCelebrationNonce(sequence: number): number {
  if (!Number.isSafeInteger(sequence) || sequence < 0 || sequence >= Number.MAX_SAFE_INTEGER) {
    return 1;
  }
  return sequence + 1;
}

/**
 * Returns true only when one successful purchase toggle crosses the boundary
 * from an incomplete list to the same list being fully purchased. Keeping both
 * snapshots here prevents initial loads, query refreshes, rollbacks, and item
 * deletion from masquerading as a user-earned completion.
 */
export function shouldCelebrateSuitcaseCompletion({
  mutationSucceeded,
  totalCountBefore,
  purchasedCountBefore,
  totalCountAfter,
  purchasedCountAfter,
  itemPurchasedBefore,
  itemPurchasedAfter,
}: SuitcaseCompletionTransition): boolean {
  if (
    !mutationSucceeded ||
    itemPurchasedBefore ||
    !itemPurchasedAfter ||
    !Number.isSafeInteger(totalCountBefore) ||
    !Number.isSafeInteger(purchasedCountBefore) ||
    !Number.isSafeInteger(totalCountAfter) ||
    !Number.isSafeInteger(purchasedCountAfter) ||
    totalCountBefore <= 0 ||
    totalCountBefore !== totalCountAfter ||
    purchasedCountBefore < 0 ||
    purchasedCountBefore >= totalCountBefore ||
    purchasedCountAfter !== totalCountAfter
  ) {
    return false;
  }

  return purchasedCountAfter === purchasedCountBefore + 1;
}
