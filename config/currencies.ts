export const CURRENCIES = [
  { code: "KRW", label: "원 (KRW)", locale: "ko-KR" },
  { code: "JPY", label: "엔 (JPY)", locale: "ja-JP" },
  { code: "USD", label: "달러 (USD)", locale: "en-US" },
  { code: "EUR", label: "유로 (EUR)", locale: "de-DE" },
  { code: "CNY", label: "위안 (CNY)", locale: "zh-CN" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function getCurrency(code: string) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}
