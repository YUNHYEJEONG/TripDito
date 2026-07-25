"use client";

import { CurrencyText } from "@/components/common/currency-text";
import type { BudgetSummary } from "@/features/budget/utils/calculate-budget";

export function ListSummary({
  summary,
  currency,
}: {
  summary: BudgetSummary;
  currency: string;
}) {
  return (
    <section className="rounded-2xl border border-border/80 bg-background px-4 py-3.5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-muted-foreground">
            구매 진행률
          </p>
          <p className="mt-0.5 text-[28px] font-bold leading-none tracking-tight">
            {Math.round(summary.purchaseProgress * 100)}%
          </p>
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            {summary.purchasedCount}/{summary.totalCount}개
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12px] font-medium text-muted-foreground">
            남은 예산
          </p>
          <p className="mt-0.5 text-lg font-bold tracking-tight">
            <CurrencyText
              amount={summary.remainingBudget}
              currency={currency}
            />
          </p>
        </div>
      </div>
      <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${summary.purchaseProgress * 100}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
        <div>
          <p className="text-[12px] text-muted-foreground">예상 총액</p>
          <CurrencyText
            amount={summary.estimatedTotal}
            currency={currency}
            className="font-semibold"
          />
        </div>
        <div>
          <p className="text-[12px] text-muted-foreground">구매 완료</p>
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
