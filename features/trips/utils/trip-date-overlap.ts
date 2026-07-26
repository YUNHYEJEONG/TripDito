import type { Trip } from "../schema";

/**
 * 두 일자 구간이 하루라도 겹치면 true (양끝 포함, YYYY-MM-DD)
 */
export function datesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  if (!startA || !endA || !startB || !endB) return false;
  return startA <= endB && startB <= endA;
}

/**
 * 기간이 겹치는 다른 여행을 찾습니다.
 * @param excludeTripId 수정 중인 여행 id — 자기 자신은 중복으로 보지 않음
 */
export function findOverlappingTrip(
  trips: Trip[],
  startDate: string,
  endDate: string,
  excludeTripId?: string,
): Trip | null {
  if (!startDate || !endDate || endDate < startDate) return null;

  const others = excludeTripId
    ? trips.filter((trip) => trip.id !== excludeTripId)
    : trips;

  return (
    others.find((trip) =>
      datesOverlap(startDate, endDate, trip.startDate, trip.endDate),
    ) ?? null
  );
}

export const TRIP_DATE_OVERLAP_MESSAGE = "이미 등록된 여행 기간입니다.";

export function tripDateOverlapMessage(overlapping: Trip) {
  return `${overlapping.city} 여행과 기간이 겹칩니다.`;
}
