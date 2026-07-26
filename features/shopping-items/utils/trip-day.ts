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

/** 여러 예상 구매일 → 여행 일차 목록 (오름차순, 중복 제거) */
export function getTripDayNumbers(
  startDate: string,
  endDate: string,
  dates: string[] | null | undefined,
): number[] {
  if (!dates?.length) return [];
  const days = new Set<number>();
  for (const date of dates) {
    const day = getTripDayNumber(startDate, endDate, date);
    if (day != null) days.add(day);
  }
  return [...days].sort((a, b) => a - b);
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

/** 레거시 단일 필드 → 배열 정규화 */
export function normalizePlannedPurchaseDates(item: {
  plannedPurchaseDates?: string[] | null;
  plannedPurchaseDate?: string | null;
}): string[] {
  if (Array.isArray(item.plannedPurchaseDates)) {
    return [
      ...new Set(
        item.plannedPurchaseDates
          .map((date) => date?.trim())
          .filter((date): date is string => Boolean(date)),
      ),
    ].sort();
  }
  const legacy = item.plannedPurchaseDate?.trim();
  return legacy ? [legacy] : [];
}
