/**
 * Frankfurter — 수출입은행 장애/한도 초과 시 폴백
 * https://www.frankfurter.app/
 */

import { getFxDisplayUnit } from "@/features/fx/lib/fx-display-units";

const API_BASE = "https://api.frankfurter.dev/v1";

const SUPPORTED = new Set(["USD", "JPY", "EUR", "CNY", "HKD"]);

export function isFrankfurterSupported(currency: string): boolean {
  return SUPPORTED.has(currency.toUpperCase());
}

export type FrankfurterCompareResult = {
  currency: string;
  date: string;
  previousDate: string | null;
  unitSize: number;
  unitLabel: string;
  krwPerUnit: number;
  previousKrwPerUnit: number | null;
  changePct: number | null;
  source: "frankfurter";
};

type FrankfurterRateResponse = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

/** 1 {currency} = rate KRW */
async function fetchForeignToKrw(
  currency: string,
  datePath: "latest" | string,
): Promise<{ date: string; krwPerOne: number } | null> {
  const code = currency.toUpperCase();
  const path =
    datePath === "latest"
      ? `${API_BASE}/latest`
      : `${API_BASE}/${datePath}`;
  const url = `${path}?from=${encodeURIComponent(code)}&to=KRW`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as FrankfurterRateResponse;
  const krwPerOne = data.rates.KRW;
  if (!Number.isFinite(krwPerOne) || krwPerOne <= 0) return null;
  return {
    date: data.date,
    krwPerOne,
  };
}

function addDaysIso(dateIso: string, delta: number): string {
  const ms = Date.parse(`${dateIso}T12:00:00Z`) + delta * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

export async function fetchFrankfurterCompare(
  currency: string,
): Promise<FrankfurterCompareResult> {
  const code = currency.toUpperCase();
  const display = getFxDisplayUnit(code);
  if (!display || !isFrankfurterSupported(code)) {
    throw new Error(`UNSUPPORTED_CURRENCY:${code}`);
  }

  const current = await fetchForeignToKrw(code, "latest");
  if (!current) {
    throw new Error("FRANKFURTER_NO_RATE");
  }

  let previous: { date: string; krwPerOne: number } | null = null;
  for (let i = 1; i <= 5; i++) {
    const prevDate = addDaysIso(current.date, -i);
    previous = await fetchForeignToKrw(code, prevDate);
    if (previous) break;
  }

  const krwPerUnit = current.krwPerOne * display.unitSize;
  const previousKrwPerUnit = previous
    ? previous.krwPerOne * display.unitSize
    : null;

  const changePct =
    previousKrwPerUnit && previousKrwPerUnit !== 0
      ? ((krwPerUnit - previousKrwPerUnit) / previousKrwPerUnit) * 100
      : null;

  return {
    currency: code,
    date: current.date,
    previousDate: previous?.date ?? null,
    unitSize: display.unitSize,
    unitLabel: display.unitLabel,
    krwPerUnit,
    previousKrwPerUnit,
    changePct,
    source: "frankfurter",
  };
}
