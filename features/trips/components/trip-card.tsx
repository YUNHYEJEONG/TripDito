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
      className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-background px-3.5 py-3.5 transition-colors active:bg-secondary/70"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
            {trip.name}
          </h2>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {trip.city}, {trip.country}
          <span className="mx-1.5 text-border">·</span>
          {formatDateRange(trip.startDate, trip.endDate)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
          <span>
            예산{" "}
            <CurrencyText
              amount={trip.budget}
              currency={trip.currency}
              className="font-medium text-foreground"
            />
          </span>
          {typeof progress === "number" ? (
            <span className="font-medium text-primary">
              구매 {Math.round(progress * 100)}%
            </span>
          ) : null}
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground/80 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
