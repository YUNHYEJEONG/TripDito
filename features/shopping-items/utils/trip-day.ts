import { getTripStayLength } from "@/features/home/utils/trip-card-meta";

/** 여행 시작일 기준 1일차 인덱스 (범위 밖이면 null) */
export function getTripDayNumber(
  startDate: string,
  endDate: string,
  dateIso: string | null | undefined,
): number | null {
  if (!dateIso) return null;
  if (dateIso < startDate || dateIso > endDate) return null;
  const start = new Date(`${startDate}T00:00:00`);
  const date = new Date(`${dateIso}T00:00:00`);
  const diff = Math.round(
    (date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diff + 1;
}

export function getTripDayFilterOptions(startDate: string, endDate: string) {
  const { days } = getTripStayLength(startDate, endDate);
  return Array.from({ length: Math.max(days, 0) }, (_, i) => i + 1);
}

export function addDaysIso(startDate: string, dayOffset: number): string {
  const ms =
    Date.parse(`${startDate}T12:00:00`) + dayOffset * 86_400_000;
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
