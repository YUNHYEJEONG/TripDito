import type { Trip } from "../schema";

export function datesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) {
  if (!startA || !endA || !startB || !endB) return false;
  return startA <= endB && startB <= endA;
}

export function findOverlappingTrip(
  trips: Trip[],
  startDate: string,
  endDate: string,
  excludeTripId?: string,
) {
  if (!startDate || !endDate || endDate < startDate) return null;
  return (
    trips.find(
      (trip) =>
        trip.id !== excludeTripId &&
        datesOverlap(startDate, endDate, trip.startDate, trip.endDate),
    ) ?? null
  );
}

export function tripDateOverlapMessage(overlapping: Trip) {
  return `${overlapping.city} 여행과 기간이 겹쳐요. 날짜를 다시 확인해 주세요.`;
}
