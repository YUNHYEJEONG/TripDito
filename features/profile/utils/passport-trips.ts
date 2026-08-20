import type { Trip } from "@/features/trips/types";

export function getTodayKeyInKorea(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const valueByPart = new Map(parts.map((part) => [part.type, part.value]));

  return `${valueByPart.get("year")}-${valueByPart.get("month")}-${valueByPart.get("day")}`;
}

export function getCompletedPassportTrips(
  trips: readonly Trip[],
  todayKey = getTodayKeyInKorea(),
) {
  return trips
    .filter((trip) => trip.endDate < todayKey)
    .toSorted((a, b) => b.endDate.localeCompare(a.endDate));
}
