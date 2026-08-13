export function todayKstIso(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function kstHour(now = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      hour: "numeric",
      hourCycle: "h23",
    }).format(now),
  );
}

export const FX_PUBLISH_HOUR_KST = 11;
const DAY_KEY = "trip-shopping:fx-sync-day:";
const QUOTE_KEY = "trip-shopping:fx-sync-quote:";
const RETRY_KEY = "trip-shopping:fx-post-publish:";

function read(key: string) {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  } catch {
    // A private browser may reject persistence; the query still succeeds.
  }
}

export function markFxSynced(currency: string, quoteDate: string, now = new Date()) {
  const code = currency.toUpperCase();
  const today = todayKstIso(now);
  write(`${DAY_KEY}${code}`, today);
  write(`${QUOTE_KEY}${code}`, quoteDate);
  // 11시 직후 공급자가 아직 전일 종가를 반환할 수 있습니다. 당일 고시를
  // 실제로 받은 경우에만 오늘의 post-publish 동기화를 완료 처리합니다.
  if (
    kstHour(now) >= FX_PUBLISH_HOUR_KST &&
    quoteDate >= today
  ) {
    write(`${RETRY_KEY}${code}`, today);
  }
}

export function shouldForceFxRefresh(currency: string, now = new Date()) {
  const code = currency.toUpperCase();
  const today = todayKstIso(now);
  if (read(`${DAY_KEY}${code}`) !== today) return true;
  if (kstHour(now) < FX_PUBLISH_HOUR_KST) return false;
  if ((read(`${QUOTE_KEY}${code}`) ?? "") >= today) return false;
  return read(`${RETRY_KEY}${code}`) !== today;
}

export function isStaleQuoteCache(quoteDate: string, now = new Date()) {
  return quoteDate < todayKstIso(now) && kstHour(now) >= FX_PUBLISH_HOUR_KST;
}
