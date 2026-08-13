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
import { WizardActions } from "./trip-destination-step";

export type TripDetailsValues = {
  startDate: string;
  endDate: string;
  budgetMode: "unknown" | "input";
  budget: number;
};

export type TripDetailsErrors = Partial<Record<"startDate" | "endDate" | "budget", string>>;

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
  errors: TripDetailsErrors;
  isSubmitting?: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const { data: trips = [] } = useTrips();
  const endDateRef = useRef<DatePickerFieldHandle>(null);
  const currencyCode = countryToCurrency(destination.country);
  const currency = getCurrency(currencyCode);
  const today = todayIsoDate();
  const endDateMin = values.startDate > today ? values.startDate : today;
  const datesComplete = Boolean(values.startDate && values.endDate && values.endDate >= values.startDate);
  const overlap = useMemo(
    () => (datesComplete ? findOverlappingTrip(trips, values.startDate, values.endDate) : null),
    [datesComplete, trips, values.endDate, values.startDate],
  );
  const dateMessage = errors.startDate ?? errors.endDate ?? (overlap ? tripDateOverlapMessage(overlap) : undefined);

  return (
    <section aria-labelledby="trip-details-title" className="mx-auto w-full max-w-2xl pb-24">
      <h2 id="trip-details-title" className="text-[22px] font-bold tracking-[-0.025em] text-ink">
        일정과 예산을 알려 주세요
      </h2>
      <p className="mt-2 text-[14px] leading-5 text-ink-2">
        날짜에 맞춰 홈과 쇼핑 준비 화면이 자동으로 바뀌어요.
      </p>

      <dl className="mt-6 grid gap-3 rounded-2xl bg-paper-2 p-4">
        <div>
          <dt className="text-[12px] text-ink-2">여행지</dt>
          <dd className="mt-1 text-[15px] font-semibold text-ink">{destination.country} · {destination.city}</dd>
        </div>
        <div>
          <dt className="text-[12px] text-ink-2">기준 통화</dt>
          <dd className="mt-1 text-[15px] font-semibold text-ink">{currency?.label ?? currencyCode}</dd>
        </div>
      </dl>

      <div className="mt-7">
        <FieldLabel required>여행 기간</FieldLabel>
        <div className="mt-2 grid gap-2">
          <DatePickerField
            aria-label="여행 시작일"
            aria-invalid={Boolean(errors.startDate)}
            aria-describedby="trip-date-message"
            placeholder="시작일"
            min={today}
            value={values.startDate}
            onChange={(startDate) => {
              const patch: Partial<TripDetailsValues> = { startDate };
              if (values.endDate && values.endDate < startDate) patch.endDate = startDate;
              onChange(patch);
            }}
            onConfirm={() => window.setTimeout(() => endDateRef.current?.open(), 0)}
          />
          <DatePickerField
            ref={endDateRef}
            aria-label="여행 종료일"
            aria-invalid={Boolean(errors.endDate)}
            aria-describedby="trip-date-message"
            placeholder="종료일"
            min={endDateMin}
            value={values.endDate}
            onChange={(endDate) => onChange({ endDate })}
          />
        </div>
        <p
          id="trip-date-message"
          className={cn("mt-2 min-h-5 text-[12px]", dateMessage ? "text-destructive" : "text-ink-2")}
          role={dateMessage ? "alert" : undefined}
        >
          {dateMessage ?? "과거 날짜는 선택할 수 없어요."}
        </p>
      </div>

      <div className="mt-6">
        <FieldLabel required>쇼핑 예산</FieldLabel>
        <div role="radiogroup" aria-label="쇼핑 예산 입력 방식" className="mt-2 grid grid-cols-2 gap-2">
          {([
            { value: "unknown" as const, label: "아직 모름" },
            { value: "input" as const, label: "직접 입력" },
          ]).map((option) => {
            const selected = values.budgetMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange({ budgetMode: option.value, ...(option.value === "unknown" ? { budget: 0 } : {}) })}
                className={cn(
                  "min-h-12 rounded-xl border border-rule bg-paper px-3 text-[14px] font-semibold text-ink outline-none hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-focus",
                  selected && "border-accent-text bg-paper-2 text-accent-text",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {values.budgetMode === "input" ? (
          <div className="mt-3">
            <div className="relative">
              <Input
                aria-label={`쇼핑 예산, ${currencyCode}`}
                aria-invalid={Boolean(errors.budget)}
                aria-describedby="trip-budget-message"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                placeholder="0"
                className="pr-16 text-right tabular-nums"
                value={Number.isFinite(values.budget) ? String(values.budget) : ""}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "");
                  onChange({ budget: digits ? Number(digits) : Number.NaN });
                }}
              />
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[13px] font-semibold text-ink-2">
                {currencyCode}
              </span>
            </div>
            <p id="trip-budget-message" className={cn("mt-2 text-[12px]", errors.budget ? "text-destructive" : "text-ink-2")} role={errors.budget ? "alert" : undefined}>
              {errors.budget ?? `상품 가격과 같은 ${currencyCode} 단위로 입력해 주세요.`}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-[12px] leading-5 text-ink-2">
            예산이 정해지지 않아도 여행을 만들 수 있고, 나중에 수정할 수 있어요.
          </p>
        )}
      </div>

      <WizardActions>
        <Button type="button" variant="secondary" className="flex-1" disabled={isSubmitting} onClick={onBack}>이전</Button>
        <Button type="button" className="flex-1" loading={isSubmitting} loadingLabel="만드는 중…" disabled={Boolean(overlap)} onClick={onSubmit}>여행 만들기</Button>
      </WizardActions>
    </section>
  );
}
