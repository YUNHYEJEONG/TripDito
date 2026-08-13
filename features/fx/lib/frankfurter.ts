import { getFxDisplayUnit } from "./fx-display-units";

const API_BASE = "https://api.frankfurter.dev/v1";
const SUPPORTED = new Set(["USD", "JPY", "EUR", "CNY", "HKD"]);

export function isFrankfurterSupported(currency: string) {
  return SUPPORTED.has(currency.toUpperCase());
}

type RateResponse = {
  date: string;
  rates: Record<string, number>;
};

async function fetchForeignToKrw(currency: string, date: "latest" | string) {
  const response = await fetch(
    `${API_BASE}/${date}?from=${encodeURIComponent(currency)}&to=KRW`,
    { cache: "no-store", headers: { Accept: "application/json" } },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as RateResponse;
  const krwPerOne = data.rates.KRW;
  return Number.isFinite(krwPerOne) && krwPerOne > 0
    ? { date: data.date, krwPerOne }
    : null;
}

function addDaysIso(date: string, delta: number) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + delta * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

export async function fetchFrankfurterCompare(currency: string) {
  const code = currency.toUpperCase();
  const display = getFxDisplayUnit(code);
  if (!display || !isFrankfurterSupported(code)) {
    throw new Error(`UNSUPPORTED_CURRENCY:${code}`);
  }
  const current = await fetchForeignToKrw(code, "latest");
  if (!current) throw new Error("FRANKFURTER_NO_RATE");
  let previous: Awaited<ReturnType<typeof fetchForeignToKrw>> = null;
  for (let offset = 1; offset <= 5 && !previous; offset += 1) {
    previous = await fetchForeignToKrw(code, addDaysIso(current.date, -offset));
  }
  const krwPerUnit = current.krwPerOne * display.unitSize;
  const previousKrwPerUnit = previous
    ? previous.krwPerOne * display.unitSize
    : null;
  return {
    currency: code,
    date: current.date,
    previousDate: previous?.date ?? null,
    unitSize: display.unitSize,
    unitLabel: display.unitLabel,
    krwPerUnit,
    previousKrwPerUnit,
    amountPer1000Krw: 1000 / current.krwPerOne,
    previousAmountPer1000Krw: previous ? 1000 / previous.krwPerOne : null,
    changePct:
      previousKrwPerUnit && previousKrwPerUnit !== 0
        ? ((krwPerUnit - previousKrwPerUnit) / previousKrwPerUnit) * 100
        : null,
    source: "frankfurter" as const,
  };
}
