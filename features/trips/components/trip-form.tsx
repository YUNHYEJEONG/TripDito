"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { FieldLabel } from "@/components/common/field-label";
import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrency } from "@/config/currencies";
import { FLIGHT_DESTINATIONS } from "@/features/destinations/constants";
import { formatTripStayLabel } from "@/features/home/utils/trip-card-meta";
import { searchDestinations } from "@/features/shots/utils/shot-query";
import { cn } from "@/lib/utils";
import { defaultTripFormValues } from "../constants";
import {
  MAX_TRIP_TAGS,
  TRIP_TAG_OPTIONS,
  type TripTagId,
} from "../constants/trip-tags";
import { useTrips } from "../hooks/use-trips";
import { countryToCurrency } from "../lib/country-currency";
import type { TripFormValues } from "../schema";
import {
  findOverlappingTrip,
  tripDateOverlapMessage,
} from "../utils/trip-date-overlap";

type BudgetMode = "unknown" | "input";

export function TripForm({
  tripId,
  defaultValues,
  submitLabel = "저장",
  onSubmit,
  onCancel,
  children,
}: {
  /** 수정 시 자기 자신은 중복 검사에서 제외 */
  tripId?: string;
  defaultValues?: Partial<TripFormValues>;
  submitLabel?: string;
  onSubmit: (values: TripFormValues) => Promise<void> | void;
  onCancel?: () => void;
  children?: React.ReactNode;
}) {
  const { data: trips = [] } = useTrips();
  const initial = { ...defaultTripFormValues, ...defaultValues };

  const [destinationQuery, setDestinationQuery] = useState("");
  const [country, setCountry] = useState(initial.country);
  const [city, setCity] = useState(initial.city);
  const [tripTags, setTripTags] = useState<TripTagId[]>(
    initial.tripTags ?? [],
  );
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [budgetMode, setBudgetMode] = useState<BudgetMode>(
    initial.budget > 0 ? "input" : "unknown",
  );
  const [budget, setBudget] = useState(initial.budget);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    destination?: string;
    startDate?: string;
    endDate?: string;
    budget?: string;
  }>({});

  const currency = countryToCurrency(country);
  const currencyLabel = getCurrency(currency).label;
  const currencyUnit = currencyLabel.split(" ")[0] ?? currency;

  const destinationResults = useMemo(
    () => searchDestinations(FLIGHT_DESTINATIONS, destinationQuery),
    [destinationQuery],
  );

  const datesComplete =
    Boolean(startDate) && Boolean(endDate) && endDate >= startDate;

  /** 수정 중이면 자기 자신(tripId)은 제외하고 다른 여행만 대조 */
  const overlappingTrip = useMemo(() => {
    if (!datesComplete) return null;
    return findOverlappingTrip(trips, startDate, endDate, tripId);
  }, [datesComplete, endDate, startDate, tripId, trips]);
  const hasOverlap = Boolean(overlappingTrip);

  function selectDestination(next: { city: string; country: string }) {
    setCity(next.city);
    setCountry(next.country);
    setDestinationQuery("");
    setErrors((prev) => ({ ...prev, destination: undefined }));
  }

  function toggleTag(id: TripTagId) {
    if (tripTags.includes(id)) {
      setTripTags(tripTags.filter((tag) => tag !== id));
      return;
    }
    if (tripTags.length >= MAX_TRIP_TAGS) return;
    setTripTags([...tripTags, id]);
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!city.trim() || !country.trim()) {
      next.destination = "여행지를 선택하세요.";
    }
    if (!startDate) next.startDate = "시작일을 선택하세요.";
    if (!endDate) next.endDate = "종료일을 선택하세요.";
    if (startDate && endDate && endDate < startDate) {
      next.endDate = "종료일은 시작일 이후여야 합니다.";
    }
    if (budgetMode === "input") {
      if (!Number.isFinite(budget) || budget < 0) {
        next.budget = "예산은 0 이상이어야 합니다.";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    if (findOverlappingTrip(trips, startDate, endDate, tripId)) return;

    const stayLabel = formatTripStayLabel(startDate, endDate);
    const values: TripFormValues = {
      name: `${city} ${stayLabel}`,
      country,
      city,
      startDate,
      endDate,
      currency,
      budget: budgetMode === "unknown" ? 0 : budget,
      tripTags,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }

  const dateError = errors.startDate || errors.endDate;
  const hasDestination = Boolean(city && country);

  return (
    <div className="flex flex-col gap-5 pb-24">
      <div className="flex flex-col gap-1.5">
        <FieldLabel required>내 여행지</FieldLabel>
        {hasDestination ? (
          <p className="text-[15px] text-foreground">
            {country} · {city}
          </p>
        ) : (
          <p className="text-[13px] text-muted-foreground">
            검색으로 여행지를 선택하세요.
          </p>
        )}
        {errors.destination ? (
          <p className="text-xs text-destructive">{errors.destination}</p>
        ) : null}
      </div>

      <SearchInput
        value={destinationQuery}
        onChange={setDestinationQuery}
        placeholder="여행지를 검색해보세요"
        className="[&_input]:rounded-full [&_input]:bg-[#F2F4F6]"
      />

      {destinationQuery.trim() ? (
        <ul className="flex flex-col">
          {destinationResults.length === 0 ? (
            <li className="py-8 text-center text-[13px] text-muted-foreground">
              검색 결과가 없습니다
            </li>
          ) : (
            destinationResults.map((dest) => {
              const selected =
                city === dest.city && country === dest.country;
              return (
                <li key={`${dest.country}-${dest.city}`}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 py-3 text-left",
                      selected && "bg-primary/5",
                    )}
                    onClick={() =>
                      selectDestination({
                        city: dest.city,
                        country: dest.country,
                      })
                    }
                  >
                    <MapPin className="size-5 shrink-0 text-[#848C94]" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-primary">
                        {dest.city}
                      </span>
                      <span className="block text-[12px] text-[#848C94]">
                        {dest.country}
                      </span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-[#848C94]" />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      <div>
        <h3 className="mb-1 text-[14px] font-bold text-foreground">
          어떤 여행인가요?
        </h3>
        <p className="mb-3 text-[12px] text-muted-foreground">
          최대 {MAX_TRIP_TAGS}개까지 선택할 수 있어요 (선택)
        </p>
        <div className="flex flex-wrap gap-2">
          {TRIP_TAG_OPTIONS.map((tag) => {
            const selected = tripTags.includes(tag.id);
            const disabled =
              !selected && tripTags.length >= MAX_TRIP_TAGS;
            return (
              <button
                key={tag.id}
                type="button"
                disabled={disabled}
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-[#E5E8EB] bg-background text-foreground hover:bg-[#F2F4F6]",
                  disabled && "opacity-40",
                )}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>여행 기간</FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="시작일"
            className="min-w-0 flex-1"
            value={startDate}
            onChange={(e) => {
              const next = e.target.value;
              setStartDate(next);
              if (endDate && next && endDate < next) {
                setEndDate(next);
              }
            }}
          />
          <span
            className="shrink-0 text-[14px] font-medium text-muted-foreground"
            aria-hidden
          >
            ~
          </span>
          <Input
            type="date"
            aria-label="종료일"
            className="min-w-0 flex-1"
            min={startDate || undefined}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {dateError ? (
          <p className="text-xs text-destructive">{dateError}</p>
        ) : overlappingTrip ? (
          <p className="text-xs text-destructive">
            {tripDateOverlapMessage(overlappingTrip)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>통화</FieldLabel>
        <Input value={currencyLabel} readOnly tabIndex={-1} />
      </div>

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
            const selected = budgetMode === option.value;
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
                  setBudgetMode(option.value)
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {budgetMode === "input" ? (
          <div className="mt-1">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                placeholder="예산을 입력하세요"
                className="min-w-0 flex-1 text-right"
                value={Number.isFinite(budget) ? String(budget) : ""}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  setBudget(digits === "" ? Number.NaN : Number(digits));
                }}
              />
              <span className="shrink-0 text-[15px] text-foreground">
                {currencyUnit}
              </span>
            </div>
            {errors.budget ? (
              <p className="mt-1.5 text-xs text-destructive">{errors.budget}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {children}

      <div className="fixed inset-x-0 bottom-0 z-30 bg-canvas px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 md:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[480px] gap-2 md:max-w-[720px] lg:max-w-[960px]">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
          ) : null}
          <Button
            type="button"
            className="flex-1"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={isSubmitting || hasOverlap}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
