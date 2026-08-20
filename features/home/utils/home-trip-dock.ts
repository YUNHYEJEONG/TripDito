import type { HomeMode } from "@/features/home/utils/get-home-mode";
import {
  getCurrentTripDay,
  getDaysUntilTrip,
} from "@/features/home/utils/get-home-mode";
import type { Trip } from "@/features/trips/types";

export const HOME_TRIP_DOCK_SCROLL_THRESHOLD_PX = 72;
export const HOME_TRIP_DOCK_EXPANDED_HEIGHT_PX = 72;
export const HOME_TRIP_DOCK_COMPACT_HEIGHT_PX = 56;
export const HOME_NEW_TRIP_HREF = "/trips/new?returnTo=/home";

/** AppShell에 붙여 마지막 콘텐츠가 펼쳐진 도크 아래에 가리지 않게 한다. */
export const HOME_TRIP_DOCK_CLEARANCE_CLASSNAME =
  "pb-[calc(var(--tab-bar-height)+6.25rem+env(safe-area-inset-bottom))]";

export type HomeTripDockState = HomeMode | "none";

export type HomeTripDockIconKey =
  | "empty"
  | "calendar"
  | "plane"
  | "location"
  | "stamp";

export type HomeTripDockMetrics = {
  itemCount?: number;
  purchasedCount?: number;
};

const STATE_COPY = {
  none: { statusLabel: "여행 없음", iconKey: "empty" },
  idle: {
    statusLabel: "준비 전",
    iconKey: "calendar",
  },
  prep: {
    statusLabel: "여행 계획",
    iconKey: "plane",
  },
  live: {
    statusLabel: "여행 중",
    iconKey: "location",
  },
  after: {
    statusLabel: "결산",
    iconKey: "stamp",
  },
} as const;

function parseIsoDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return { year, month, day };
}

function normalizeCount(value: number | undefined) {
  return Math.max(0, Math.floor(Number.isFinite(value) ? (value ?? 0) : 0));
}

function formatDockStartDate(startDate: string, today: string) {
  const start = parseIsoDate(startDate);
  const current = parseIsoDate(today);
  if (!start.year || !start.month || !start.day) return startDate;
  if (start.year === current.year) return `${start.month}.${start.day}`;
  return `${String(start.year).slice(-2)}.${start.month}.${start.day}`;
}

function formatDockMonthDay(isoDate: string) {
  const { month, day } = parseIsoDate(isoDate);
  return month && day ? `${month}.${day}` : isoDate;
}

export function getHomeTripDockDayLabel(
  trip: Trip,
  mode: HomeMode,
  today: string,
  metrics?: HomeTripDockMetrics,
) {
  if (mode === "live") return `${getCurrentTripDay(trip, today)}일차`;

  if (mode === "after") {
    const purchasedCount = normalizeCount(metrics?.purchasedCount);
    return `${purchasedCount}개`;
  }

  const days = getDaysUntilTrip(trip, today);
  return days === 0 ? "D-Day" : `D-${days}`;
}

export function getHomeTripDockViewModel(
  trip: Trip | null,
  mode: HomeMode,
  today: string,
  metrics?: HomeTripDockMetrics,
) {
  if (!trip) {
    return {
      state: "none" as const,
      statusLabel: STATE_COPY.none.statusLabel,
      iconKey: STATE_COPY.none.iconKey as HomeTripDockIconKey,
      cityLabel: "",
      dayLabel: "",
      metricValue: "",
      metricCaption: "",
      itemCount: 0,
      purchasedCount: 0,
      ariaLabel: "내 여행 목록 열기, 등록된 여행 없음",
    };
  }

  const copy = STATE_COPY[mode];
  const itemCount = normalizeCount(metrics?.itemCount);
  const purchasedCount = Math.min(
    itemCount || Number.MAX_SAFE_INTEGER,
    normalizeCount(metrics?.purchasedCount),
  );
  const dayLabel = getHomeTripDockDayLabel(trip, mode, today, metrics);
  const recordLabel = purchasedCount > 0 ? `${purchasedCount}개 기록` : "여행 기록";
  const metricValue =
    mode === "idle"
      ? formatDockStartDate(trip.startDate, today)
      : mode === "after"
        ? `${purchasedCount}개`
        : dayLabel;
  const metricCaption =
    mode === "idle"
      ? "출발일"
      : mode === "prep"
        ? "출발까지"
        : mode === "live"
          ? `${formatDockMonthDay(trip.endDate)}까지`
          : purchasedCount > 0
            ? "구매 기록"
            : "기록 없음";

  return {
    state: mode,
    statusLabel: copy.statusLabel,
    iconKey: copy.iconKey as HomeTripDockIconKey,
    cityLabel: trip.city,
    dayLabel,
    metricValue,
    metricCaption,
    itemCount,
    purchasedCount,
    ariaLabel: `내 여행 목록 열기, ${trip.name}, ${trip.city} ${copy.statusLabel}, ${
      mode === "live"
        ? dayLabel
        : mode === "after"
          ? recordLabel
          : dayLabel
    }`,
  };
}
