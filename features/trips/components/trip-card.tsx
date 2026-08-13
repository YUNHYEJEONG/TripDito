"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Trip } from "../types";
import { CurrencyText } from "@/components/common/currency-text";
import {
  formatTripDateDot,
  formatTripDateMd,
} from "@/features/home/utils/trip-card-meta";

export type TripCardStatus = "live" | "prep" | "complete";

export function TripCard({
  trip,
  progress,
}: {
  trip: Trip;
  progress?: number;
}) {
  return (
    <Link
      href={`/trips/${trip.id}?returnTo=${encodeURIComponent("/my-trips")}`}
      className="group flex items-center gap-3 rounded-2xl border border-rule bg-paper px-4 py-3 outline-none transition-colors hover:bg-paper-2 active:bg-paper-2 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
    >
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
          {trip.name}
        </h2>
        <p className="mt-1 flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground">
          <span className="min-w-0 truncate">
            {trip.city}, {trip.country}
          </span>
          <span className="shrink-0 text-border" aria-hidden>
            ·
          </span>
          <time
            className="shrink-0 whitespace-nowrap"
            dateTime={`${trip.startDate}/${trip.endDate}`}
          >
            {formatCompactDateRange(trip.startDate, trip.endDate)}
          </time>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
          <span>
            예산{" "}
            {trip.budgetMode === "unknown" ? (
              <strong className="font-medium text-foreground">미정</strong>
            ) : (
              <CurrencyText
                amount={trip.budget}
                currency={trip.currency}
                className="font-medium text-foreground"
              />
            )}
          </span>
          {typeof progress === "number" ? (
            <span className="font-medium text-accent-text">
              구매 {Math.round(progress * 100)}%
            </span>
          ) : null}
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground/80 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function formatCompactDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) return `${startDate}–${endDate}`;
  if (startDate.slice(0, 4) === endDate.slice(0, 4)) {
    return `${formatTripDateDot(startDate)}–${formatTripDateMd(endDate)}`;
  }
  return `${formatTripDateDot(startDate)}–${formatTripDateDot(endDate)}`;
}
