"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Trip } from "@/features/trips/types";
import { CurrencyText } from "@/components/common/currency-text";
import {
  formatScheduleBadge,
  getTripScheduleLabel,
} from "@/features/home/utils/get-upcoming-trip";
import {
  formatTripStayWithPeriod,
  getTripBackgroundSrc,
} from "@/features/home/utils/trip-card-meta";

export function HomeUpcomingTripCard({
  trip,
  progress,
  requiredBudget,
}: {
  trip: Trip;
  progress?: number;
  /** 쇼핑리스트 예상 총액 */
  requiredBudget: number;
}) {
  const label = getTripScheduleLabel(trip);
  const badge = formatScheduleBadge(label);
  const bgSrc = getTripBackgroundSrc(trip.country, trip.city);
  const periodLabel = formatTripStayWithPeriod(trip.startDate, trip.endDate);
  const showProgress = label.kind === "ongoing" && typeof progress === "number";

  return (
    <section>
      <Link
        href={`/trips/${trip.id}`}
        className="group relative block min-h-[148px] overflow-hidden rounded-2xl bg-[#2a2f36]"
        style={{
          backgroundImage: `url(${bgSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/65 to-black/55"
          aria-hidden
        />

        <div className="relative flex min-h-[148px] flex-col justify-between gap-3 px-4 py-3.5 pr-11 text-white">
          <h2 className="pr-14 text-[13px] font-semibold tracking-tight text-white/95">
            {label.kind === "ongoing" ? "여행중인 이곳" : "다가오는 여행"}
          </h2>

          <span className="absolute top-3.5 right-3 z-10 rounded-md bg-[#8ECAE6]/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            {badge}
          </span>

          <div className="min-w-0">
            <h3 className="truncate text-[22px] font-bold tracking-tight text-white">
              {trip.city}
            </h3>
            <p className="mt-1.5 w-fit text-[12px] text-white/80">
              {periodLabel}
            </p>
            <div className="mt-1.5 flex w-fit flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px]">
              <span className="text-white/80">
                필요예산{" "}
                <CurrencyText
                  amount={requiredBudget}
                  currency={trip.currency}
                  className="font-semibold text-white"
                />
              </span>
              {showProgress ? (
                <span className="font-medium text-white/90">
                  구매 {Math.round(progress * 100)}%
                </span>
              ) : null}
            </div>
          </div>

          <ChevronRight
            className="absolute top-1/2 right-3 size-5 shrink-0 -translate-y-1/2 text-white/80 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </Link>
    </section>
  );
}
