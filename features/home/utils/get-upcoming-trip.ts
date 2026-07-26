import type { Trip } from "@/features/trips/types";

/** 로컬 날짜를 YYYY-MM-DD로 (타임존 드리프트 방지) */
export function todayIsoDate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 다가오는(또는 진행 중) 여행 1건.
 * endDate >= today 인 여행 중 startDate가 가장 빠른 것.
 */
export function getUpcomingTrip(
  trips: Trip[],
  today = todayIsoDate(),
): Trip | null {
  const candidates = trips
    .filter((trip) => trip.endDate >= today)
    .sort((a, b) => {
      if (a.startDate !== b.startDate) {
        return a.startDate.localeCompare(b.startDate);
      }
      return a.createdAt.localeCompare(b.createdAt);
    });

  return candidates[0] ?? null;
}

export type TripScheduleLabel =
  | { kind: "dDay"; days: number }
  | { kind: "ongoing" }
  | { kind: "past" };

export function getTripScheduleLabel(
  trip: Trip,
  today = todayIsoDate(),
): TripScheduleLabel {
  if (today > trip.endDate) return { kind: "past" };
  if (today >= trip.startDate) return { kind: "ongoing" };

  const start = new Date(`${trip.startDate}T00:00:00`);
  const now = new Date(`${today}T00:00:00`);
  const days = Math.round(
    (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return { kind: "dDay", days };
}

export function formatScheduleBadge(label: TripScheduleLabel): string {
  if (label.kind === "ongoing") return "여행 중";
  if (label.kind === "past") return "종료";
  if (label.days === 0) return "D-Day";
  return `D-${label.days}`;
}

/** 내 여행지 리스트용: 접속일 기준 여행 상태 */
export type TripPhase = "preparing" | "ongoing" | "ended";

export function getTripPhase(trip: Trip, today = todayIsoDate()): TripPhase {
  if (today > trip.endDate) return "ended";
  if (today >= trip.startDate) return "ongoing";
  return "preparing";
}

export function formatTripPhaseTag(phase: TripPhase): string {
  if (phase === "ongoing") return "여행중";
  if (phase === "ended") return "여행끝";
  return "여행준비";
}

