"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Trip } from "../types";
import { formatDateRange } from "@/lib/format/date";
import { CurrencyText } from "@/components/common/currency-text";

export function TripCard({
  trip,
  progress,
}: {
  trip: Trip;
  progress?: number;
}) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group flex items-center gap-4 rounded-2xl bg-background px-4 py-4 transition-colors hover:bg-background/80"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-base font-medium text-foreground">
            {trip.name}
          </h2>
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {trip.city}, {trip.country}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDateRange(trip.startDate, trip.endDate)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>
            예산{" "}
            <CurrencyText
              amount={trip.budget}
              currency={trip.currency}
              className="text-foreground"
            />
          </span>
          {typeof progress === "number" ? (
            <span>구매 {Math.round(progress * 100)}%</span>
          ) : null}
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
