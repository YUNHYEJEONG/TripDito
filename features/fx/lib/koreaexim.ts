/**
 * 한국수출입은행 현재환율 API (AP01)
 * https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON
 */

export type KoreaEximRow = {
  result: number;
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
};

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

async function fetchRowsForDate(
  authKey: string,
  dateIso: string,
): Promise<KoreaEximRow[]> {
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
    return [];
  }
  return data as KoreaEximRow[];
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
    if (row && row.result === 1) {
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
  /** 외화 unitSize 단위당 원화 (매매기준율). 예: JPY는 100엔당 원 */
  unitSize: number;
  krwPerUnit: number;
  previousKrwPerUnit: number | null;
  /** 참고용: 1,000원당 외화 */
  amountPer1000Krw: number;
  previousAmountPer1000Krw: number | null;
  /** 원화 기준 전일 대비 변동률 (+면 외화 강세) */
  changePct: number | null;
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

  const today = todayKstIso(now);
  const current = await findLatestQuote(authKey, code, today);
  if (!current) {
    throw new Error("NO_RATE_DATA");
  }

  const previous = await findLatestQuote(
    authKey,
    code,
    addDaysIso(current.date, -1),
  );

  const changePct =
    previous && previous.dealBasR !== 0
      ? ((current.dealBasR - previous.dealBasR) / previous.dealBasR) * 100
      : null;

  return {
    currency: code,
    date: current.date,
    previousDate: previous?.date ?? null,
    unitSize: current.unitSize,
    krwPerUnit: current.dealBasR,
    previousKrwPerUnit: previous?.dealBasR ?? null,
    amountPer1000Krw: current.amountPer1000Krw,
    previousAmountPer1000Krw: previous?.amountPer1000Krw ?? null,
    changePct,
  };
}
