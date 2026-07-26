/** KST 기준 환율 갱신 스케줄 유틸 */

export function todayKstIso(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function kstHour(now = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    hourCycle: "h23",
  }).format(now);
  return Number(hour);
}

/** 수출입은행 고시는 영업일 오전 11시 전후 */
export const FX_PUBLISH_HOUR_KST = 11;

const SYNC_DAY_PREFIX = "trip-shopping:fx-sync-day:";
const SYNC_QUOTE_PREFIX = "trip-shopping:fx-sync-quote:";
const POST_PUBLISH_PREFIX = "trip-shopping:fx-post-publish:";

function readKey(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeKey(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function getFxSyncDay(currency: string): string | null {
  return readKey(`${SYNC_DAY_PREFIX}${currency.toUpperCase()}`);
}

export function getFxSyncQuoteDate(currency: string): string | null {
  return readKey(`${SYNC_QUOTE_PREFIX}${currency.toUpperCase()}`);
}

export function markFxSynced(
  currency: string,
  quoteDate: string,
  now = new Date(),
) {
  const code = currency.toUpperCase();
  const today = todayKstIso(now);
  writeKey(`${SYNC_DAY_PREFIX}${code}`, today);
  writeKey(`${SYNC_QUOTE_PREFIX}${code}`, quoteDate);

  // 고시 시각 이후 조회면, 오늘 고시 재시도는 완료로 표시
  // (주말이라 고시일이 어제여도 반복 호출하지 않음)
  if (kstHour(now) >= FX_PUBLISH_HOUR_KST) {
    writeKey(`${POST_PUBLISH_PREFIX}${code}`, today);
  }
}

/**
 * - 오늘 아직 일 1회 동기화 전이면 true
 * - 11시 이후인데 고시일이 오늘 이전이고, 오늘 재시도를 아직 안 했으면 true
 */
export function shouldForceFxRefresh(
  currency: string,
  now = new Date(),
): boolean {
  const code = currency.toUpperCase();
  const today = todayKstIso(now);
  const syncDay = getFxSyncDay(code);

  if (syncDay !== today) return true;

  if (kstHour(now) < FX_PUBLISH_HOUR_KST) return false;

  const quoteDate = getFxSyncQuoteDate(code);
  if (quoteDate && quoteDate >= today) return false;

  const postTried = readKey(`${POST_PUBLISH_PREFIX}${code}`);
  return postTried !== today;
}

/** 서버 캐시: 오늘 고시 가능 시각 이후인데 캐시 고시일이 어제면 무효 */
export function isStaleQuoteCache(
  quoteDate: string,
  now = new Date(),
): boolean {
  const today = todayKstIso(now);
  if (quoteDate >= today) return false;
  return kstHour(now) >= FX_PUBLISH_HOUR_KST;
}
