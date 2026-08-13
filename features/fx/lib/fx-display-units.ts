export type FxDisplayUnit = { unitSize: number; unitLabel: string };

const FX_DISPLAY_UNITS: Record<string, FxDisplayUnit> = {
  JPY: { unitSize: 100, unitLabel: "JPY 100" },
  USD: { unitSize: 1, unitLabel: "USD 1" },
  CNY: { unitSize: 1, unitLabel: "CNY 1" },
  EUR: { unitSize: 1, unitLabel: "EUR 1" },
  TWD: { unitSize: 10, unitLabel: "TWD 10" },
  HKD: { unitSize: 10, unitLabel: "HKD 10" },
};

export function getFxDisplayUnit(currency: string) {
  return FX_DISPLAY_UNITS[currency.toUpperCase()] ?? null;
}

export function toDisplayKrwPerUnit(
  dealBasR: number,
  apiUnitSize: number,
  displayUnitSize: number,
) {
  if (!Number.isFinite(dealBasR) || dealBasR <= 0 || apiUnitSize <= 0) {
    throw new Error("INVALID_FX_UNIT");
  }
  return (dealBasR / apiUnitSize) * displayUnitSize;
}
