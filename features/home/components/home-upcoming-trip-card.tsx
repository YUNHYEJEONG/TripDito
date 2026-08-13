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
import { withReturnTo } from "@/lib/navigation/return-to";

export function getHomeTripCardAction(
  trip: Trip,
  today?: string,
): {
  href: string;
  label: string;
  ariaLabel: string;
  schedule: ReturnType<typeof getTripScheduleLabel>;
} {
  const schedule = getTripScheduleLabel(trip, today);

  if (schedule.kind === "ongoing") {
    return {
      href: withReturnTo(
        `/map?q=${encodeURIComponent(trip.city)}`,
        "/home",
      ),
      label: "현지 지도와 쇼핑 장소 보기",
      ariaLabel: `${trip.city} 현지 지도와 쇼핑 장소 보기`,
      schedule,
    };
  }

  if (schedule.kind === "past") {
    return {
      href: withReturnTo(`/trips/${encodeURIComponent(trip.id)}`, "/home"),
      label: "지난 여행 기록 보기",
      ariaLabel: `${trip.name} 기록 보기`,
      schedule,
    };
  }

  return {
    href: withReturnTo(`/trips/${encodeURIComponent(trip.id)}`, "/home"),
    label: "다가오는 여행 계획 보기",
    ariaLabel: `${trip.name} 계획 보기`,
    schedule,
  };
}

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
  const action = getHomeTripCardAction(trip);
  const label = action.schedule;
  const badge = formatScheduleBadge(label);
  const bgSrc = getTripBackgroundSrc(trip.country, trip.city);
  const periodLabel = formatTripStayWithPeriod(trip.startDate, trip.endDate);
  const showProgress = label.kind === "ongoing" && typeof progress === "number";

  return (
    <section>
      <Link
        href={action.href}
        aria-label={action.ariaLabel}
        className="group relative block min-h-[148px] overflow-hidden rounded-2xl bg-ink outline-none hover:[&>div:first-child]:bg-ink/80 active:[&>div:first-child]:bg-ink/90 focus-visible:ring-2 focus-visible:ring-focus"
        style={{
          backgroundImage: `url(${bgSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0 bg-ink/75 transition-colors duration-120"
          aria-hidden
        />

        <div className="relative flex min-h-[148px] flex-col justify-between gap-3 px-4 py-4 pr-11 text-paper">
          <h2 className="pr-14 text-[13px] font-semibold tracking-tight text-paper">
            {action.label}
          </h2>

          <span className="absolute top-4 right-3 z-10 rounded-md bg-gift-acq px-2 py-1 text-[11px] font-semibold text-ink">
            {badge}
          </span>

          <div className="min-w-0">
            <h3 className="truncate text-[22px] font-bold tracking-tight text-paper">
              {trip.city}
            </h3>
            <p className="mt-2 w-fit text-[12px] text-paper/80">
              {periodLabel}
            </p>
            <div className="mt-2 flex w-fit flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
              <span className="text-paper/80">
                필요예산{" "}
                <CurrencyText
                  amount={requiredBudget}
                  currency={trip.currency}
                  className="font-semibold text-paper"
                />
              </span>
              {showProgress ? (
                <span className="font-medium text-paper/90">
                  구매 {Math.round(progress * 100)}%
                </span>
              ) : null}
            </div>
          </div>

          <ChevronRight
            className="absolute top-1/2 right-3 size-5 shrink-0 -translate-y-1/2 text-paper/80 transition-transform duration-120 group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </Link>
    </section>
  );
}
