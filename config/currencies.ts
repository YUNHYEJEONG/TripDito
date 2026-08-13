/**
 * 여행과 쇼핑리스트에서 사용하는 ISO 4217 통화 목록입니다.
 *
 * 환율 API 지원 여부와는 별개로, 이미 저장된 여행의 통화를 정확히
 * 표시할 수 있어야 하므로 운영판에서 지원하던 목록을 유지합니다.
 */
export const CURRENCIES = [
  { code: "KRW", label: "원 (KRW)", locale: "ko-KR" },
  { code: "JPY", label: "엔 (JPY)", locale: "ja-JP" },
  { code: "USD", label: "달러 (USD)", locale: "en-US" },
  { code: "EUR", label: "유로 (EUR)", locale: "de-DE" },
  { code: "CNY", label: "위안 (CNY)", locale: "zh-CN" },
  { code: "HKD", label: "홍콩달러 (HKD)", locale: "zh-HK" },
  { code: "MOP", label: "마카오파타카 (MOP)", locale: "zh-MO" },
  { code: "TWD", label: "대만달러 (TWD)", locale: "zh-TW" },
  { code: "THB", label: "바트 (THB)", locale: "th-TH" },
  { code: "VND", label: "동 (VND)", locale: "vi-VN" },
  { code: "PHP", label: "페소 (PHP)", locale: "en-PH" },
  { code: "SGD", label: "싱가포르달러 (SGD)", locale: "en-SG" },
  { code: "MYR", label: "링깃 (MYR)", locale: "ms-MY" },
  { code: "IDR", label: "루피아 (IDR)", locale: "id-ID" },
  { code: "AUD", label: "호주달러 (AUD)", locale: "en-AU" },
  { code: "NZD", label: "뉴질랜드달러 (NZD)", locale: "en-NZ" },
  { code: "CAD", label: "캐나다달러 (CAD)", locale: "en-CA" },
  { code: "GBP", label: "파운드 (GBP)", locale: "en-GB" },
  { code: "CHF", label: "스위스프랑 (CHF)", locale: "de-CH" },
  { code: "MXN", label: "페소 (MXN)", locale: "es-MX" },
  { code: "TRY", label: "리라 (TRY)", locale: "tr-TR" },
  { code: "AED", label: "디르함 (AED)", locale: "ar-AE" },
  { code: "QAR", label: "리얄 (QAR)", locale: "ar-QA" },
  { code: "INR", label: "루피 (INR)", locale: "en-IN" },
  { code: "NPR", label: "네팔루피 (NPR)", locale: "ne-NP" },
  { code: "LKR", label: "스리랑카루피 (LKR)", locale: "si-LK" },
  { code: "KHR", label: "리엘 (KHR)", locale: "km-KH" },
  { code: "LAK", label: "킵 (LAK)", locale: "lo-LA" },
  { code: "MMK", label: "짯 (MMK)", locale: "my-MM" },
  { code: "MNT", label: "투그리크 (MNT)", locale: "mn-MN" },
  { code: "KZT", label: "텐게 (KZT)", locale: "kk-KZ" },
  { code: "UZS", label: "숨 (UZS)", locale: "uz-UZ" },
  { code: "KGS", label: "솜 (KGS)", locale: "ky-KG" },
  { code: "TMT", label: "마나트 (TMT)", locale: "tk-TM" },
  { code: "PLN", label: "즈워티 (PLN)", locale: "pl-PL" },
  { code: "CZK", label: "코루나 (CZK)", locale: "cs-CZ" },
  { code: "HUF", label: "포린트 (HUF)", locale: "hu-HU" },
  { code: "ILS", label: "셰켈 (ILS)", locale: "he-IL" },
  { code: "ETB", label: "비르 (ETB)", locale: "am-ET" },
  { code: "BND", label: "브루나이달러 (BND)", locale: "ms-BN" },
  { code: "DKK", label: "크로네 (DKK)", locale: "da-DK" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export type CurrencyMeta = {
  code: string;
  label: string;
  locale: string;
};

/**
 * 등록되지 않은 코드를 KRW로 바꾸지 않습니다.
 * 호출자는 원래 ISO 코드를 그대로 보존해 표시해야 합니다.
 */
export function getCurrency(code: string): CurrencyMeta {
  const normalized = code.trim().toUpperCase();
  return (
    CURRENCIES.find((currency) => currency.code === normalized) ?? {
      code: normalized,
      label: normalized || "통화 미지정",
      locale: "ko-KR",
    }
  );
}

/** 소수점 없이 표기하는 통화 */
export const ZERO_DECIMAL_CURRENCIES = new Set<string>([
  "JPY",
  "KRW",
  "VND",
  "IDR",
  "KHR",
  "LAK",
  "MMK",
  "UZS",
  "HUF",
]);
