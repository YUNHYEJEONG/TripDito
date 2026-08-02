"use client";

import { useMemo, useRef } from "react";
import { FieldLabel } from "@/components/common/field-label";
import {
  DatePickerField,
  type DatePickerFieldHandle,
} from "@/components/common/date-picker-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrency } from "@/config/currencies";
import { todayIsoDate } from "@/features/home/utils/get-upcoming-trip";
import { cn } from "@/lib/utils";
import { useTrips } from "../hooks/use-trips";
import { countryToCurrency } from "../lib/country-currency";
import {
  findOverlappingTrip,
  tripDateOverlapMessage,
} from "../utils/trip-date-overlap";
import type { TripDestination } from "./trip-destination-step";

export type BudgetMode = "unknown" | "input";

export type TripDetailsValues = {
  startDate: string;
  endDate: string;
  budgetMode: BudgetMode;
  budget: number;
};

export function TripDetailsStep({
  destination,
  values,
  onChange,
  errors,
  isSubmitting,
  onBack,
  onSubmit,
}: {
  destination: TripDestination;
  values: TripDetailsValues;
  onChange: (patch: Partial<TripDetailsValues>) => void;
  errors: {
    startDate?: string;
    endDate?: string;
    budget?: string;
  };
  isSubmitting?: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const { data: trips = [] } = useTrips();
  const endDateRef = useRef<DatePickerFieldHandle>(null);
  const currency = countryToCurrency(destination.country);
  const currencyLabel = getCurrency(currency).label;
  const dateError = errors.startDate || errors.endDate;
  const today = todayIsoDate();
  const endDateMin =
    values.startDate && values.startDate > today ? values.startDate : today;

  const datesComplete =
    Boolean(values.startDate) &&
    Boolean(values.endDate) &&
    values.endDate >= values.startDate;

  const overlappingTrip = useMemo(() => {
    if (!datesComplete) return null;
    return findOverlappingTrip(trips, values.startDate, values.endDate);
  }, [datesComplete, trips, values.endDate, values.startDate]);

  const hasOverlap = Boolean(overlappingTrip);
  const overlapMessage = overlappingTrip
    ? tripDateOverlapMessage(overlappingTrip)
    : null;

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex flex-col gap-1.5">
        <FieldLabel>내 여행지</FieldLabel>
        <p className="text-[15px] text-foreground">
          {destination.country} · {destination.city}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>여행 기간</FieldLabel>
        <div className="flex items-center gap-2">
          <DatePickerField
            aria-label="시작일"
            placeholder="시작일"
            min={today}
            value={values.startDate}
            onChange={(next) => {
              const patch: Partial<typeof values> = { startDate: next };
              if (values.endDate && next && values.endDate < next) {
                patch.endDate = next;
              }
              onChange(patch);
            }}
            onConfirm={() => {
              window.setTimeout(() => endDateRef.current?.open(), 0);
            }}
          />
          <span
            className="shrink-0 text-[14px] font-medium text-muted-foreground"
            aria-hidden
          >
            ~
          </span>
          <DatePickerField
            ref={endDateRef}
            aria-label="종료일"
            placeholder="종료일"
            min={endDateMin}
            value={values.endDate}
            onChange={(next) => onChange({ endDate: next })}
          />
        </div>
        {dateError ? (
          <p className="text-xs text-destructive">{dateError}</p>
        ) : overlapMessage ? (
          <p className="text-xs text-destructive">{overlapMessage}</p>
        ) : null}
      </div>

      <Field label="통화">
        <Input value={currencyLabel} readOnly tabIndex={-1} />
      </Field>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>예산</FieldLabel>
        <div
          role="radiogroup"
          aria-label="예산 선택"
          className="grid grid-cols-2 gap-2"
        >
          {(
            [
              { value: "unknown" as const, label: "모름" },
              { value: "input" as const, label: "입력하기" },
            ] as const
          ).map((option) => {
            const selected = values.budgetMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={cn(
                  "h-10 rounded-lg border text-[14px] font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-[#E5E8EB] bg-background text-foreground hover:bg-[#F2F4F6]",
                )}
                onClick={() =>
                  onChange({
                    budgetMode: option.value,
                    budget: option.value === "unknown" ? 0 : values.budget,
                  })
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {values.budgetMode === "input" ? (
          <div className="mt-1">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                placeholder="예산을 입력하세요"
                className="min-w-0 flex-1 text-right"
                value={
                  Number.isFinite(values.budget) ? String(values.budget) : ""
                }
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  onChange({
                    budget: digits === "" ? Number.NaN : Number(digits),
                  });
                }}
              />
              <span className="shrink-0 text-[15px] text-foreground">원</span>
            </div>
            {errors.budget ? (
              <p className="mt-1.5 text-xs text-destructive">{errors.budget}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-canvas px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 md:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[480px] gap-2 md:max-w-[720px] lg:max-w-[960px]">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onBack}
            disabled={isSubmitting}
          >
            이전
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={onSubmit}
            disabled={isSubmitting || hasOverlap}
          >
            등록
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
