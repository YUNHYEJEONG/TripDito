"use client";

import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  CircleCheck,
  Plane,
} from "lucide-react";
import type { Trip } from "../types";
import { CurrencyText } from "@/components/common/currency-text";
import {
  formatTripDateDot,
  formatTripDateMd,
} from "@/features/home/utils/trip-card-meta";
import { withReturnTo } from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";

export type TripCardStatus = "live" | "prep" | "complete";

const tripStatusPresentation = {
  live: {
    label: "여행 중",
    icon: Plane,
    className: "bg-live-tint text-live-deep",
  },
  prep: {
    label: "출발 예정",
    icon: CalendarClock,
    className: "bg-accent/10 text-accent-text",
  },
  complete: {
    label: "여행 완료",
    icon: CircleCheck,
    className: "bg-success/10 text-success-text",
  },
} satisfies Record<
  TripCardStatus,
  {
    label: string;
    icon: typeof Plane;
    className: string;
  }
>;

/**
 * 여행 상태 배지의 **유일한 정의**. 여행 탭 카드와 홈의 여행 전환 시트가 같은 것을 쓴다 —
 * 같은 여행이 화면마다 `여행 중 / 결산`처럼 다른 이름과 다른 색으로 보이면, 사용자는 둘이
 * 같은 상태인지 매번 대조해야 한다.
 */
export function tripCardStatusFromHomeMode(
  mode: "idle" | "prep" | "live" | "after",
): TripCardStatus {
  if (mode === "live") return "live";
  if (mode === "after") return "complete";
  // 먼 미래(idle)도 사용자에게는 그냥 출발 예정이다.
  return "prep";
}

export function TripStatusBadge({ status }: { status: TripCardStatus }) {
  const presentation = tripStatusPresentation[status];
  const Icon = presentation.icon;

  return (
    <span
      className={cn(
        "inline-flex h-6 w-[5.25rem] shrink-0 items-center justify-center gap-1 rounded-full px-2 text-[12px] leading-4 font-semibold whitespace-nowrap",
        presentation.className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2} aria-hidden />
      {presentation.label}
    </span>
  );
}

export function TripCard({
  trip,
  progress,
  status,
  returnTo = "/passport",
}: {
  trip: Trip;
  progress?: number;
  status?: TripCardStatus;
  returnTo?: string;
}) {
  return (
    <Link
      href={withReturnTo(`/trips/${trip.id}`, returnTo)}
      className="group flex w-full min-w-0 items-center gap-3 rounded-2xl border border-rule bg-paper px-4 py-3 outline-none transition-colors hover:bg-paper-2 active:bg-paper-2 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-foreground">
            {trip.name}
          </h3>
          {status ? <TripStatusBadge status={status} /> : null}
        </div>
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
  if (!startDate || !endDate) return `${startDate}-${endDate}`;
  if (startDate.slice(0, 4) === endDate.slice(0, 4)) {
    return `${formatTripDateDot(startDate)}-${formatTripDateMd(endDate)}`;
  }
  return `${formatTripDateDot(startDate)}-${formatTripDateDot(endDate)}`;
}
