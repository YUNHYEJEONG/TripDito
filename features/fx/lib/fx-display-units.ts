/**
 * 홈 환율 카드 표시 단위
 * - unitSize: 해당 통화 몇 단위를 기준으로 원화를 보여줄지
 * - unitLabel: 첫 줄에 쓰는 짧은 표기
 */

export type FxDisplayUnit = {
  unitSize: number;
  unitLabel: string;
};

const FX_DISPLAY_UNITS: Record<string, FxDisplayUnit> = {
  JPY: { unitSize: 100, unitLabel: "JPY 100" },
  USD: { unitSize: 1, unitLabel: "USD 1" },
  CNY: { unitSize: 1, unitLabel: "CNY 1" },
  EUR: { unitSize: 1, unitLabel: "EUR 1" },
  TWD: { unitSize: 10, unitLabel: "TWD 10" },
  HKD: { unitSize: 10, unitLabel: "HKD 10" },
};

export function getFxDisplayUnit(currency: string): FxDisplayUnit | null {
  return FX_DISPLAY_UNITS[currency.toUpperCase()] ?? null;
}

/** API 고시 단위(deal_bas_r 기준) → 화면 표시 단위의 원화 */
export function toDisplayKrwPerUnit(
  dealBasR: number,
  apiUnitSize: number,
  displayUnitSize: number,
): number {
  if (!Number.isFinite(dealBasR) || dealBasR <= 0 || apiUnitSize <= 0) {
    throw new Error("INVALID_FX_UNIT");
  }
  return (dealBasR / apiUnitSize) * displayUnitSize;
}
