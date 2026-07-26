"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Trip } from "../types";
import { CurrencyText } from "@/components/common/currency-text";
import {
  formatTripPhaseTag,
  getTripPhase,
  type TripPhase,
} from "@/features/home/utils/get-upcoming-trip";
import { formatTripStayWithPeriod } from "@/features/home/utils/trip-card-meta";
import { getTripTagLabel } from "../constants/trip-tags";
import { cn } from "@/lib/utils";

const phaseTagClassName: Record<TripPhase, string> = {
  ongoing: "bg-white/20 text-white",
  preparing: "bg-[#F2F4F6] text-[#4E5968]",
  ended: "bg-[#F2F4F6] text-[#ADB5BD]",
};

export function TripCard({
  trip,
  estimatedTotal = 0,
  progress = 0,
}: {
  trip: Trip;
  /** 쇼핑리스트 총 예상 비용 */
  estimatedTotal?: number;
  progress?: number;
}) {
  const phase = getTripPhase(trip);
  const tag = formatTripPhaseTag(phase);
  const periodLabel = formatTripStayWithPeriod(trip.startDate, trip.endDate);
  const isOngoing = phase === "ongoing";
  const tripTags = trip.tripTags ?? [];

  return (
    <Link
      href={`/trips/${trip.id}`}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-3.5 py-3.5 transition-colors",
        isOngoing
          ? "bg-primary active:bg-[#1b64da]"
          : "border border-border/80 bg-background active:bg-secondary/70",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex w-fit rounded-md px-2 py-0.5 text-[11px] font-semibold",
              phaseTagClassName[phase],
            )}
          >
            {tag}
          </span>
          {tripTags.map((id) => (
            <span
              key={id}
              className={cn(
                "inline-flex w-fit rounded-md px-2 py-0.5 text-[11px] font-semibold",
                isOngoing
                  ? "bg-white/20 text-white"
                  : "bg-primary/10 text-primary",
              )}
            >
              {getTripTagLabel(id)}
            </span>
          ))}
        </div>
        <h2
          className={cn(
            "mt-1.5 truncate text-[15px] font-semibold tracking-tight",
            isOngoing ? "text-white" : "text-foreground",
          )}
        >
          {trip.city}
        </h2>
        <p
          className={cn(
            "mt-0.5 truncate text-[13px]",
            isOngoing ? "text-white/80" : "text-muted-foreground",
          )}
        >
          {periodLabel}
        </p>
        <div
          className={cn(
            "mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]",
            isOngoing ? "text-white/80" : "text-muted-foreground",
          )}
        >
          <span>
            총 예상 비용{" "}
            <CurrencyText
              amount={estimatedTotal}
              currency={trip.currency}
              className={cn(
                "font-medium",
                isOngoing ? "text-white" : "text-foreground",
              )}
            />
          </span>
          <span
            className={cn(
              "font-medium",
              isOngoing ? "text-white" : "text-primary",
            )}
          >
            구매 {Math.round(progress * 100)}%
          </span>
        </div>
      </div>
      <ChevronRight
        className={cn(
          "size-5 shrink-0 transition-transform group-hover:translate-x-0.5",
          isOngoing ? "text-white/80" : "text-muted-foreground/80",
        )}
      />
    </Link>
  );
}
