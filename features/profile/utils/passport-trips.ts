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

/** 완료한 여행: 종료일이 지났거나, "여행 마치기"로 DONE 처리한 여행 */
export function isPassportCompletedTrip(
  trip: Pick<Trip, "endDate" | "status">,
  todayKey = getTodayKeyInKorea(),
) {
  return trip.status === "DONE" || trip.endDate < todayKey;
}

/** 서버에 저장된 도장 페이지 (여행 ID → 페이지 번호) */
export function getServerPassportStampPages(trips: readonly Trip[]) {
  return Object.fromEntries(
    trips.flatMap((trip) =>
      typeof trip.passportPage === "number" && trip.passportPage > 0
        ? [[trip.id, trip.passportPage] as const]
        : [],
    ),
  ) as Readonly<Record<string, number>>;
}

export function getCompletedPassportTrips(
  trips: readonly Trip[],
  todayKey = getTodayKeyInKorea(),
) {
  return trips
    .filter((trip) => isPassportCompletedTrip(trip, todayKey))
    .toSorted((a, b) => b.endDate.localeCompare(a.endDate));
}
