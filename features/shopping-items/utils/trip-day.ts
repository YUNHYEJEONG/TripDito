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
  return Array.from({ length: Math.max(days, 0) }, (_, index) => index + 1);
}

export function addDaysIso(startDate: string, dayOffset: number): string {
  const milliseconds =
    Date.parse(`${startDate}T12:00:00Z`) + dayOffset * 86_400_000;
  return new Date(milliseconds).toISOString().slice(0, 10);
}

/**
 * 배열과 단일 필드를 합쳐 canonical 배열을 만듭니다. 둘 중 하나를 버리지
 * 않으므로 운영판 데이터와 현재 브랜치 데이터가 함께 있어도 안전합니다.
 */
export function normalizePlannedPurchaseDates(item: {
  plannedPurchaseDates?: string[] | null;
  plannedPurchaseDate?: string | null;
}): string[] {
  const candidates = [
    ...(Array.isArray(item.plannedPurchaseDates)
      ? item.plannedPurchaseDates
      : []),
    item.plannedPurchaseDate,
  ];

  return [
    ...new Set(
      candidates
        .filter((date): date is string => typeof date === "string")
        .map((date) => date.trim())
        .filter(Boolean),
    ),
  ].sort();
}

export function getPrimaryPlannedPurchaseDate(item: {
  plannedPurchaseDates?: string[] | null;
  plannedPurchaseDate?: string | null;
}): string | null {
  return normalizePlannedPurchaseDates(item)[0] ?? null;
}
