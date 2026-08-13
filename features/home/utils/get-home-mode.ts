import type { Trip } from "@/features/trips/types";
import { todayIsoDate } from "@/features/home/utils/get-upcoming-trip";

/**
 * `idle` is the ordinary home state. A trip only owns the home experience
 * while it is close enough to need preparation, in progress, or completed.
 */
export type HomeMode = "idle" | "prep" | "live" | "after";

export const PREP_WINDOW_DAYS = 7;

function dayDistance(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T12:00:00`) - Date.parse(`${from}T12:00:00`)) /
      86_400_000,
  );
}

export function getTripHomeMode(
  trip: Trip,
  today = todayIsoDate(),
): HomeMode {
  if (today < trip.startDate) {
    return dayDistance(today, trip.startDate) <= PREP_WINDOW_DAYS
      ? "prep"
      : "idle";
  }
  if (today <= trip.endDate) return "live";
  return "after";
}

/**
 * Picks a contextual trip. Far-future trips stay in the ordinary (`idle`)
 * home, while completed trips remain available as settlement history.
 *
 * Automatic priority is live → nearest prep → most recent after. Sorting is
 * deterministic so repository ordering cannot unexpectedly change the home.
 */
export function selectHomeTrip(
  trips: Trip[],
  today = todayIsoDate(),
): Trip | null {
  const live = trips
    .filter((trip) => getTripHomeMode(trip, today) === "live")
    .sort(
      (a, b) =>
        a.endDate.localeCompare(b.endDate) ||
        a.startDate.localeCompare(b.startDate) ||
        a.id.localeCompare(b.id),
    );
  if (live[0]) return live[0];

  const prep = trips
    .filter((trip) => getTripHomeMode(trip, today) === "prep")
    .sort(
      (a, b) =>
        a.startDate.localeCompare(b.startDate) ||
        a.endDate.localeCompare(b.endDate) ||
        a.id.localeCompare(b.id),
    );
  if (prep[0]) return prep[0];

  const after = trips
    .filter((trip) => getTripHomeMode(trip, today) === "after")
    .sort(
      (a, b) =>
        b.endDate.localeCompare(a.endDate) ||
        b.startDate.localeCompare(a.startDate) ||
        a.id.localeCompare(b.id),
    );
  return after[0] ?? null;
}

/**
 * Resolves the trip shown on home when a user selection was persisted.
 * A valid explicit selection always wins, including far-future and long-finished
 * trips. Selection represents the trip the user is viewing, while its dates
 * independently determine which home experience is rendered.
 *
 * Automatic contextual priority is only used when no selection exists or the
 * persisted trip was deleted.
 */
export function resolveHomeTrip(
  trips: Trip[],
  persistedTripId: string | null | undefined,
  today = todayIsoDate(),
): Trip | null {
  const persistedTrip = persistedTripId
    ? trips.find((trip) => trip.id === persistedTripId)
    : undefined;

  if (persistedTrip) return persistedTrip;

  return selectHomeTrip(trips, today);
}

export function getDaysUntilTrip(
  trip: Trip,
  today = todayIsoDate(),
): number {
  return Math.max(0, dayDistance(today, trip.startDate));
}

export function getCurrentTripDay(
  trip: Trip,
  today = todayIsoDate(),
): number {
  return Math.max(1, dayDistance(trip.startDate, today) + 1);
}

const ARRIVAL_CODES: Array<[RegExp, string]> = [
  [/도쿄|tokyo/i, "NRT"],
  [/오사카|osaka/i, "KIX"],
  [/오키나와|okinawa|나하|naha/i, "OKA"],
  [/삿포로|sapporo/i, "CTS"],
  [/후쿠오카|fukuoka/i, "FUK"],
  [/타이베이|taipei/i, "TPE"],
  [/상하이|shanghai/i, "PVG"],
  [/베이징|beijing/i, "PEK"],
];

export function getArrivalCode(trip: Trip): string {
  return (
    ARRIVAL_CODES.find(([pattern]) => pattern.test(trip.city))?.[1] ??
    trip.city
  );
}
