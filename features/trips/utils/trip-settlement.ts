import type { BudgetSummary } from "@/features/budget/utils/calculate-budget";
import { getGiftTagOption } from "@/features/shopping-items/constants/gift-tags";
import type { GiftTagId } from "@/features/shopping-items/constants/gift-tags";
import {
  getTripDayNumber,
  getTripDayNumbers,
  normalizePlannedPurchaseDates,
} from "@/features/shopping-items/utils/trip-day";

export type SettlementBudgetState =
  "unknown" | "zero" | "within-budget" | "overspent";

export type SettlementBudgetViewModel = {
  state: SettlementBudgetState;
  budgetAmount: number | null;
  recordedAmount: number;
  remainingAmount: number | null;
  balanceLabel: "남음" | "초과";
  balanceAmount: number | null;
  balanceDanger: boolean;
};

export type SettlementGaugeProgress = {
  rawPercent: number | null;
  visualPercent: number;
};

/** Fills the suitcase from the purchased share of every saved shopping item. */
export function getSettlementGaugeProgress(
  purchasedCount: number,
  totalCount: number,
): SettlementGaugeProgress {
  const safeTotal = Number.isFinite(totalCount)
    ? Math.max(0, Math.floor(totalCount))
    : 0;
  if (safeTotal === 0) {
    return { rawPercent: null, visualPercent: 0 };
  }

  const safePurchased = Number.isFinite(purchasedCount)
    ? Math.min(safeTotal, Math.max(0, Math.floor(purchasedCount)))
    : 0;
  const rawPercent = (safePurchased / safeTotal) * 100;

  return {
    rawPercent,
    visualPercent: rawPercent,
  };
}

/**
 * The item model stores one recorded price, not a separate receipt total.
 * Settlement therefore calls the purchased-item sum a recorded spend amount.
 */
export function getSettlementBudgetViewModel(
  summary: BudgetSummary,
  budgetMode: "unknown" | "input" | undefined,
): SettlementBudgetViewModel {
  const recordedAmount = summary.purchasedTotal;
  const budgetIsKnown =
    budgetMode === "input" ||
    (budgetMode === undefined && summary.tripBudget > 0);

  if (!budgetIsKnown) {
    return {
      state: "unknown",
      budgetAmount: null,
      recordedAmount,
      remainingAmount: null,
      balanceLabel: "남음",
      balanceAmount: null,
      balanceDanger: false,
    };
  }

  if (summary.tripBudget === 0) {
    return {
      state: "zero",
      budgetAmount: 0,
      recordedAmount,
      remainingAmount: -recordedAmount,
      balanceLabel: recordedAmount > 0 ? "초과" : "남음",
      balanceAmount: recordedAmount,
      balanceDanger: recordedAmount > 0,
    };
  }

  const remainingAmount = summary.tripBudget - recordedAmount;

  return {
    state: remainingAmount < 0 ? "overspent" : "within-budget",
    budgetAmount: summary.tripBudget,
    recordedAmount,
    remainingAmount,
    balanceLabel: remainingAmount < 0 ? "초과" : "남음",
    balanceAmount:
      remainingAmount < 0 ? Math.abs(remainingAmount) : remainingAmount,
    balanceDanger: remainingAmount < 0,
  };
}

export function getSettlementFallbackVariant(key: string) {
  let hash = 0;
  for (const character of key.normalize("NFKC")) {
    hash = (Math.imul(hash, 31) + (character.codePointAt(0) ?? 0)) >>> 0;
  }
  return hash % 4;
}

function toKoreaIsoDate(instant: string) {
  const date = new Date(instant);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find(({ type }) => type === "year")?.value;
  const month = parts.find(({ type }) => type === "month")?.value;
  const day = parts.find(({ type }) => type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : null;
}

/** 실제 구매 시각을 우선하고, 없을 때만 예정 일차임을 명시한다. */
export function getSettlementPurchaseDayLabel(
  item: {
    purchasedAt?: string | null;
    plannedPurchaseDate?: string | null;
    plannedPurchaseDates?: string[] | null;
  },
  startDate: string,
  endDate: string,
) {
  const purchasedDate = item.purchasedAt
    ? toKoreaIsoDate(item.purchasedAt)
    : null;
  const purchasedDay = getTripDayNumber(startDate, endDate, purchasedDate);
  if (purchasedDay !== null) return `${purchasedDay}일차`;

  const plannedDays = getTripDayNumbers(
    startDate,
    endDate,
    normalizePlannedPurchaseDates(item),
  );
  return plannedDays.length > 0
    ? `예정 ${plannedDays.map((day) => `${day}일차`).join(", ")}`
    : "구매 일차 미기록";
}

function cleanRecipients(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter(
          (recipient): recipient is string => typeof recipient === "string",
        )
        .map((recipient) => recipient.trim())
        .filter(Boolean),
    ),
  ];
}

/** Named recipients win when future or migrated records contain them. */
export function getSettlementGiftLabels(item: {
  giftTags: GiftTagId[];
  giftRecipients?: unknown;
  recipients?: unknown;
}) {
  const namedRecipients = cleanRecipients(
    item.giftRecipients ?? item.recipients,
  );
  if (namedRecipients.length > 0) return namedRecipients;

  return item.giftTags
    .map((tag) => getGiftTagOption(tag)?.label)
    .filter((label): label is string => Boolean(label));
}
