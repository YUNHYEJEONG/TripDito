"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { CurrencyText } from "@/components/common/currency-text";
import { headerIconButtonClassName } from "@/components/layout/page-header";
import type { BudgetSummary } from "@/features/budget/utils/calculate-budget";
import { formatCurrency } from "@/lib/format/currency";

export function ListSummary({
  summary,
  currency,
  destinationLabel,
  periodLabel,
  editHref,
}: {
  summary: BudgetSummary;
  currency: string;
  /** 예: 오사카, 일본 */
  destinationLabel: string;
  /** 예: 5박 6일 · 2026년 7월 26일 – 2026년 7월 31일 */
  periodLabel: string;
  editHref: string;
}) {
  const hasBudget = summary.tripBudget > 0;

  return (
    <section className="rounded-2xl bg-[#F2F4F6] px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-snug text-foreground">
            {destinationLabel}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {periodLabel}
          </p>
        </div>
        <Link
          href={editHref}
          aria-label="여행 수정"
          className={headerIconButtonClassName}
        >
          <Pencil strokeWidth={2} />
        </Link>
      </div>

      <div className="mt-3.5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-muted-foreground">
            구매 진행률
          </p>
          <p className="mt-0.5 text-[28px] font-bold leading-none tracking-tight text-success">
            {Math.round(summary.purchaseProgress * 100)}%
          </p>
        </div>
        <p className="text-[13px] font-medium tabular-nums text-muted-foreground">
          {summary.purchasedCount}/{summary.totalCount}개
        </p>
      </div>
      <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-success transition-all"
          style={{ width: `${summary.purchaseProgress * 100}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-[13px]">
        <div>
          <p className="text-[12px] text-muted-foreground">예산</p>
          {hasBudget ? (
            <span className="font-semibold tabular-nums">
              {formatCurrency(summary.tripBudget, currency)}
            </span>
          ) : (
            <span className="font-semibold text-muted-foreground">모름</span>
          )}
        </div>
        <div className="text-right">
          <p className="text-[12px] text-muted-foreground">총 예상 비용</p>
          <CurrencyText
            amount={summary.estimatedTotal}
            currency={currency}
            className="font-semibold"
          />
        </div>
        <div className="text-right">
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
