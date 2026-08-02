"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/common/toast-alert";
import {
  PageHeader,
  HeaderCancelButton,
} from "@/components/layout/page-header";
import type { TripRegion } from "@/features/destinations/constants";
import { formatTripStayLabel } from "@/features/home/utils/trip-card-meta";
import { useCreateTrip } from "../hooks/use-trips";
import { countryToCurrency } from "../lib/country-currency";
import type { TripTagId } from "../constants/trip-tags";
import type { TripFormValues } from "../schema";
import {
  TripDestinationStep,
  type TripDestination,
} from "./trip-destination-step";
import {
  TripDetailsStep,
  type TripDetailsValues,
} from "./trip-details-step";
import { TripRegionStep } from "./trip-region-step";

export function NewTripWizard() {
  const router = useRouter();
  const createTrip = useCreateTrip();
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
  const [errors, setErrors] = useState<{
    startDate?: string;
    endDate?: string;
    budget?: string;
  }>({});

  function selectRegion(next: TripRegion) {
    setRegion(next);
    setDestination(null);
    setStep(2);
  }

  function validateDetails(): boolean {
    const next: typeof errors = {};
    if (!details.startDate) next.startDate = "시작일을 선택하세요.";
    if (!details.endDate) next.endDate = "종료일을 선택하세요.";
    if (
      details.startDate &&
      details.endDate &&
      details.endDate < details.startDate
    ) {
      next.endDate = "종료일은 시작일 이후여야 합니다.";
    }
    if (details.budgetMode === "input") {
      if (!Number.isFinite(details.budget) || details.budget < 0) {
        next.budget = "예산은 0 이상이어야 합니다.";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!destination || !validateDetails()) return;

    const stayLabel = formatTripStayLabel(details.startDate, details.endDate);
    const values: TripFormValues = {
      name: `${destination.city} ${stayLabel}`,
      country: destination.country,
      city: destination.city,
      startDate: details.startDate,
      endDate: details.endDate,
      currency: countryToCurrency(destination.country),
      budget: details.budgetMode === "unknown" ? 0 : details.budget,
      tripTags,
    };

    try {
      const trip = await createTrip.mutateAsync(values);
      toast.success("여행을 만들었습니다");
      router.push(`/trips/${trip.id}`);
    } catch {
      toast.error("저장에 실패했습니다");
    }
  }

  return (
    <>
      <PageHeader
        title="새 여행 등록"
        className="mb-3"
        actions={
          <HeaderCancelButton onClick={() => router.push("/my-trips")} />
        }
      />

      {step === 1 ? (
        <TripRegionStep value={region} onChange={selectRegion} />
      ) : null}

      {step === 2 && region ? (
        <TripDestinationStep
          region={region}
          value={destination}
          onChange={setDestination}
          tripTags={tripTags}
          onTripTagsChange={setTripTags}
          onBack={() => setStep(1)}
          onNext={() => {
            if (destination) setStep(3);
          }}
        />
      ) : null}

      {step === 3 && destination ? (
        <TripDetailsStep
          destination={destination}
          values={details}
          onChange={(patch) =>
            setDetails((prev) => ({ ...prev, ...patch }))
          }
          errors={errors}
          isSubmitting={createTrip.isPending}
          onBack={() => setStep(2)}
          onSubmit={() => {
            void handleSubmit();
          }}
        />
      ) : null}
    </>
  );
}
