"use client";

import { CurrencyText } from "@/components/common/currency-text";
import type { BudgetSummary } from "@/features/budget/utils/calculate-budget";

export function ListSummary({
  summary,
  currency,
  budgetKnown = true,
}: {
  summary: BudgetSummary;
  currency: string;
  budgetKnown?: boolean;
}) {
  return (
    <section className="rounded-xl bg-paper-2 px-4 py-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-ink-2">
            구매 진행률
          </p>
          <p className="mt-1 text-[28px] font-bold leading-none tracking-tight">
            {Math.round(summary.purchaseProgress * 100)}%
          </p>
          <p className="mt-2 text-[12px] text-ink-2">
            {summary.purchasedCount}/{summary.totalCount}개
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12px] font-medium text-ink-2">
            남은 예산
          </p>
          <p className="mt-1 text-lg font-bold tracking-tight">
            {budgetKnown ? (
              <CurrencyText
                amount={summary.remainingBudget}
                currency={currency}
              />
            ) : (
              "미정"
            )}
          </p>
        </div>
      </div>
      <div
        className="mt-4 h-1 overflow-hidden rounded-full bg-paper-3"
        role="progressbar"
        aria-label="구매 진행률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(summary.purchaseProgress * 100)}
      >
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${summary.purchaseProgress * 100}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-rule pt-3 text-[13px]">
        <div>
          <p className="text-[12px] text-ink-2">예상 총액</p>
          <CurrencyText
            amount={summary.estimatedTotal}
            currency={currency}
            className="font-semibold"
          />
        </div>
        <div>
          <p className="text-[12px] text-ink-2">구매 완료</p>
          <CurrencyText
            amount={summary.purchasedTotal}
            currency={currency}
            className="font-semibold"
          />
        </div>
      </div>
    </section>
  );
}
