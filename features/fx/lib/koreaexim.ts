/** 한국수출입은행 현재환율 API (AP01), with short server caches. */

import {
  getFxDisplayUnit,
  toDisplayKrwPerUnit,
} from "./fx-display-units";
import { isStaleQuoteCache, todayKstIso } from "./fx-schedule";

export type KoreaEximRow = {
  result: number | string;
  cur_unit: string;
  cur_nm: string;
  ttb: string;
  tts: string;
  deal_bas_r: string;
  bkpr: string;
  yy_efee_r: string;
  ten_dd_efee_r: string;
  kftc_bkpr: string;
  kftc_deal_bas_r: string;
};

/** 앱 통화코드 → 수출입은행 cur_unit 후보 */
const CUR_UNIT_CANDIDATES: Record<string, string[]> = {
  USD: ["USD"],
  JPY: ["JPY(100)", "JPY"],
  EUR: ["EUR"],
  CNY: ["CNH", "CNY"],
  TWD: ["TWD"],
  HKD: ["HKD"],
};

const ROW_CACHE_TTL_MS = 30 * 60 * 1000;
const COMPARE_CACHE_TTL_MS = 15 * 60 * 1000;
type CacheEntry<T> = { value: T; expiresAt: number };
const rowCache = new Map<string, CacheEntry<KoreaEximRow[]>>();
const compareCache = new Map<string, CacheEntry<KoreaEximCompareResult>>();

export function isKoreaEximSupported(currency: string): boolean {
  return currency.toUpperCase() in CUR_UNIT_CANDIDATES;
}

export function parseDealBasR(raw: string): number {
  const n = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`INVALID_DEAL_BAS_R:${raw}`);
  }
  return n;
}

/** cur_unit "JPY(100)" → 100, "USD" → 1 */
export function unitSizeFromCurUnit(curUnit: string): number {
  const m = curUnit.match(/\((\d+)\)\s*$/);
  return m ? Number(m[1]) : 1;
}

/**
 * 수출입은행 deal_bas_r = (unitSize 외화)당 원화
 * → 1,000원으로 살 수 있는 외화 금액
 */
export function foreignPer1000Krw(
  dealBasR: number,
  unitSize: number,
): number {
  return (1000 * unitSize) / dealBasR;
}

export function findCurrencyRow(
  rows: KoreaEximRow[],
  currency: string,
): KoreaEximRow | null {
  const candidates = CUR_UNIT_CANDIDATES[currency.toUpperCase()];
  if (!candidates) return null;
  for (const unit of candidates) {
    const row = rows.find((r) => r.cur_unit === unit);
    if (row) return row;
  }
  return null;
}

function yyyymmdd(dateIso: string): string {
  return dateIso.replaceAll("-", "");
}

function addDaysIso(dateIso: string, delta: number): string {
  const ms = Date.parse(`${dateIso}T12:00:00+09:00`) + delta * 86_400_000;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function readCache<T>(map: Map<string, CacheEntry<T>>, key: string) {
  const hit = map.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    map.delete(key);
    return undefined;
  }
  return hit.value;
}

function writeCache<T>(map: Map<string, CacheEntry<T>>, key: string, value: T, ttl: number) {
  map.set(key, { value, expiresAt: Date.now() + ttl });
}

function throwForResultCode(code: number): never {
  if (code === 4) throw new Error("RATE_LIMITED");
  if (code === 3) throw new Error("AUTH_ERROR");
  if (code === 2) throw new Error("DATA_CODE_ERROR");
  throw new Error(`KOREAEXIM_RESULT:${code}`);
}

async function fetchRowsForDate(
  authKey: string,
  dateIso: string,
): Promise<KoreaEximRow[]> {
  const cached = readCache(rowCache, dateIso);
  if (cached) return cached;
  const url = new URL(
    "https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON",
  );
  url.searchParams.set("authkey", authKey);
  url.searchParams.set("searchdate", yyyymmdd(dateIso));
  url.searchParams.set("data", "AP01");

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`KOREAEXIM_HTTP:${res.status}`);
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    const code = Number(
      data && typeof data === "object" && "result" in data
        ? (data as { result: unknown }).result
        : NaN,
    );
    if (Number.isFinite(code) && code !== 1) throwForResultCode(code);
    writeCache(rowCache, dateIso, [], 5 * 60 * 1000);
    return [];
  }
  const rows = data as KoreaEximRow[];
  const firstCode = Number(rows[0]?.result);
  if (Number.isFinite(firstCode) && firstCode !== 1) throwForResultCode(firstCode);
  writeCache(
    rowCache,
    dateIso,
    rows,
    rows.length === 0 && dateIso === todayKstIso()
      ? 5 * 60 * 1000
      : ROW_CACHE_TTL_MS,
  );
  return rows;
}

export type KoreaEximQuote = {
  currency: string;
  date: string;
  dealBasR: number;
  unitSize: number;
  amountPer1000Krw: number;
  curUnit: string;
};

async function findLatestQuote(
  authKey: string,
  currency: string,
  fromDateIso: string,
  maxLookback = 14,
): Promise<KoreaEximQuote | null> {
  let cursor = fromDateIso;
  for (let i = 0; i < maxLookback; i++) {
    const rows = await fetchRowsForDate(authKey, cursor);
    const row = findCurrencyRow(rows, currency);
    if (row && Number(row.result) === 1) {
      const dealBasR = parseDealBasR(row.deal_bas_r);
      const unitSize = unitSizeFromCurUnit(row.cur_unit);
      return {
        currency: currency.toUpperCase(),
        date: cursor,
        dealBasR,
        unitSize,
        amountPer1000Krw: foreignPer1000Krw(dealBasR, unitSize),
        curUnit: row.cur_unit,
      };
    }
    cursor = addDaysIso(cursor, -1);
  }
  return null;
}

export type KoreaEximCompareResult = {
  currency: string;
  date: string;
  previousDate: string | null;
  amountPer1000Krw: number;
  previousAmountPer1000Krw: number | null;
  changePct: number | null;
  unitSize: number;
  unitLabel: string;
  krwPerUnit: number;
  previousKrwPerUnit: number | null;
  source: "koreaexim";
};

/**
 * 당일(또는 최근 영업일) vs 직전 영업일 비교
 */
export async function fetchKoreaEximCompare(
  authKey: string,
  currency: string,
  now = new Date(),
): Promise<KoreaEximCompareResult> {
  const code = currency.toUpperCase();
  if (!isKoreaEximSupported(code)) {
    throw new Error(`UNSUPPORTED_CURRENCY:${code}`);
  }

  const display = getFxDisplayUnit(code);
  if (!display) throw new Error(`UNSUPPORTED_CURRENCY:${code}`);

  const today = todayKstIso(now);
  const cacheKey = `v4:${code}:${today}`;
  const cached = readCache(compareCache, cacheKey);
  if (cached && !isStaleQuoteCache(cached.date, now)) return cached;
  if (cached) compareCache.delete(cacheKey);
  const current = await findLatestQuote(authKey, code, today);
  if (!current) {
    throw new Error("NO_RATE_DATA");
  }

  const previous = await findLatestQuote(
    authKey,
    code,
    addDaysIso(current.date, -1),
  );

  const krwPerUnit = toDisplayKrwPerUnit(
    current.dealBasR,
    current.unitSize,
    display.unitSize,
  );
  const previousKrwPerUnit = previous
    ? toDisplayKrwPerUnit(previous.dealBasR, previous.unitSize, display.unitSize)
    : null;
  const changePct =
    previousKrwPerUnit && previousKrwPerUnit !== 0
      ? ((krwPerUnit - previousKrwPerUnit) / previousKrwPerUnit) * 100
      : null;

  const result: KoreaEximCompareResult = {
    currency: code,
    date: current.date,
    previousDate: previous?.date ?? null,
    amountPer1000Krw: current.amountPer1000Krw,
    previousAmountPer1000Krw: previous?.amountPer1000Krw ?? null,
    changePct,
    unitSize: display.unitSize,
    unitLabel: display.unitLabel,
    krwPerUnit,
    previousKrwPerUnit,
    source: "koreaexim",
  };
  writeCache(compareCache, cacheKey, result, COMPARE_CACHE_TTL_MS);
  return result;
}

export function clearKoreaEximCaches(currency?: string) {
  if (!currency) {
    rowCache.clear();
    compareCache.clear();
    return;
  }
  const code = currency.toUpperCase();
  for (const key of compareCache.keys()) {
    if (key.includes(`:${code}:`)) compareCache.delete(key);
  }
  // Today's empty pre-publication response is the only row that must be
  // bypassed. Historical rows remain valid and shared across currencies.
  rowCache.delete(todayKstIso());
}
