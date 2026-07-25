/**
 * 데모용 여행 카드 배경
 * - 도시 매칭 우선, 없으면 국가, 그래도 없으면 폴백
 */

type BackgroundRule = {
  match: RegExp;
  src: string;
};

const CITY_BACKGROUNDS: BackgroundRule[] = [
  {
    match: /도쿄|동경|tokyo/i,
    src: "/trip-backgrounds/tokyo.jpg",
  },
  {
    match: /오사카|osaka/i,
    src: "/trip-backgrounds/osaka.jpg",
  },
  {
    match: /오키나와|okinawa|나하|naha/i,
    src: "/trip-backgrounds/okinawa.jpg",
  },
  {
    match: /삿포로|sapporo|홋카이도|hokkaido/i,
    src: "/trip-backgrounds/sapporo.jpg",
  },
];

const COUNTRY_BACKGROUNDS: BackgroundRule[] = [
  {
    match: /일본|japan|jp\b/i,
    src: "/trip-backgrounds/japan.jpg",
  },
  {
    match: /중국|china|cn\b|중화/i,
    src: "/trip-backgrounds/china.jpg",
  },
  {
    match: /대만|taiwan|tw\b|타이완/i,
    src: "/trip-backgrounds/taiwan.jpg",
  },
];

const FALLBACK_BACKGROUND = "/trip-backgrounds/japan.jpg";

function matchBackground(
  value: string,
  rules: BackgroundRule[],
): string | null {
  const normalized = value.trim();
  if (!normalized) return null;
  for (const entry of rules) {
    if (entry.match.test(normalized)) return entry.src;
  }
  return null;
}

export function getTripBackgroundSrc(country: string, city?: string): string {
  return (
    matchBackground(city ?? "", CITY_BACKGROUNDS) ??
    matchBackground(country, COUNTRY_BACKGROUNDS) ??
    FALLBACK_BACKGROUND
  );
}

/** start~end 포함 일수 / 박 수 */
export function getTripStayLength(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const days =
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const nights = Math.max(days - 1, 0);
  return { nights, days };
}

export function formatTripStayLabel(startDate: string, endDate: string) {
  const { nights, days } = getTripStayLength(startDate, endDate);
  return `${nights}박 ${days}일`;
}

/** YYYY-MM-DD → YYYY.MM.DD */
export function formatTripDateDot(isoDate: string) {
  if (!isoDate) return "";
  return isoDate.replaceAll("-", ".");
}

export function formatTripDateDotRange(startDate: string, endDate: string) {
  return `${formatTripDateDot(startDate)} ~ ${formatTripDateDot(endDate)}`;
}

/** YYYY-MM-DD → MM.DD */
export function formatTripDateMd(isoDate: string) {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length < 3) return isoDate;
  return `${parts[1]}.${parts[2]}`;
}

/** N박 N일 (MM.DD ~ MM.DD) */
export function formatTripStayWithPeriod(startDate: string, endDate: string) {
  const stay = formatTripStayLabel(startDate, endDate);
  return `${stay} (${formatTripDateMd(startDate)} ~ ${formatTripDateMd(endDate)})`;
}
