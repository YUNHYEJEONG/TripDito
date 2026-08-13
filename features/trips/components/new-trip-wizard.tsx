"use client";

import { useState } from "react";
import type { TripRegion } from "@/features/destinations/constants";
import { formatTripStayLabel } from "@/features/home/utils/trip-card-meta";
import { useUnsavedChanges } from "@/lib/navigation/unsaved-changes";
import { cn } from "@/lib/utils";
import type { TripTagId } from "../constants/trip-tags";
import { countryToCurrency } from "../lib/country-currency";
import type { TripFormValues } from "../schema";
import {
  TripDestinationStep,
  type TripDestination,
} from "./trip-destination-step";
import {
  TripDetailsStep,
  type TripDetailsErrors,
  type TripDetailsValues,
} from "./trip-details-step";
import { TripRegionStep } from "./trip-region-step";

const STEPS = ["지역", "여행지", "일정·예산"] as const;

export function NewTripWizard({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting?: boolean;
  onSubmit: (values: TripFormValues) => Promise<void> | void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [region, setRegion] = useState<TripRegion | null>(null);
  const [destination, setDestination] = useState<TripDestination | null>(null);
  const [tripTags, setTripTags] = useState<TripTagId[]>([]);
  const [details, setDetails] = useState<TripDetailsValues>({
    startDate: "",
    endDate: "",
    budgetMode: "unknown",
    budget: 0,
  });
  const [errors, setErrors] = useState<TripDetailsErrors>({});

  useUnsavedChanges(Boolean(region || destination || tripTags.length || details.startDate || details.endDate));

  function updateDetails(patch: Partial<TripDetailsValues>) {
    setDetails((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      if ("startDate" in patch) delete next.startDate;
      if ("startDate" in patch || "endDate" in patch) delete next.endDate;
      if ("budget" in patch || "budgetMode" in patch) delete next.budget;
      return next;
    });
  }

  function validateDetails() {
    const next: TripDetailsErrors = {};
    if (!details.startDate) next.startDate = "시작일을 선택해 주세요.";
    if (!details.endDate) next.endDate = "종료일을 선택해 주세요.";
    if (details.startDate && details.endDate && details.endDate < details.startDate) {
      next.endDate = "종료일은 시작일 이후여야 해요.";
    }
    if (details.budgetMode === "input" && (!Number.isFinite(details.budget) || details.budget < 0)) {
      next.budget = "0 이상의 예산을 입력해 주세요.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!destination || !validateDetails()) return;
    const values: TripFormValues = {
      name: `${destination.city} ${formatTripStayLabel(details.startDate, details.endDate)}`,
      country: destination.country,
      city: destination.city,
      startDate: details.startDate,
      endDate: details.endDate,
      currency: countryToCurrency(destination.country),
      budget: details.budgetMode === "unknown" ? 0 : details.budget,
      budgetMode: details.budgetMode,
      tripTags,
    };
    await onSubmit(values);
  }

  return (
    <div>
      <nav aria-label="새 여행 등록 단계" className="mx-auto mb-8 w-full max-w-2xl">
        <ol className="grid grid-cols-3 gap-2">
          {STEPS.map((label, index) => {
            const number = index + 1;
            const active = number === step;
            const complete = number < step;
            return (
              <li
                key={label}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "border-t-2 pt-2 text-[12px] font-medium text-ink-3",
                  (active || complete) && "border-accent-text text-accent-text",
                )}
              >
                <span className="sr-only">{number}단계: </span>{label}
              </li>
            );
          })}
        </ol>
        <p className="sr-only" aria-live="polite">{step} / {STEPS.length}단계, {STEPS[step - 1]}</p>
      </nav>

      {step === 1 ? (
        <TripRegionStep
          value={region}
          onChange={(next) => {
            if (next !== region) setDestination(null);
            setRegion(next);
            setStep(2);
          }}
        />
      ) : null}

      {step === 2 && region ? (
        <TripDestinationStep
          region={region}
          value={destination}
          onChange={setDestination}
          tripTags={tripTags}
          onTripTagsChange={setTripTags}
          onBack={() => setStep(1)}
          onNext={() => destination && setStep(3)}
        />
      ) : null}

      {step === 3 && destination ? (
        <TripDetailsStep
          destination={destination}
          values={details}
          onChange={updateDetails}
          errors={errors}
          isSubmitting={isSubmitting}
          onBack={() => setStep(2)}
          onSubmit={() => void submit()}
        />
      ) : null}
    </div>
  );
}
