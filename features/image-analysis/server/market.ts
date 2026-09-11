import "server-only";

/** 사진 분석·가격 검색에 쓰는 여행지 컨텍스트 (여행의 국가·통화에서 파생) */
export type Market = {
  countryCode: string;
  /** 프롬프트용 한글 국가명 */
  countryName: string;
  currency: string;
  /** 현지 언어 표기 (검색어 작성용) */
  language: string;
  /** SerpAPI google_shopping 파라미터 */
  gl: string;
  hl: string;
};

/** 공통코드 NTN(여행 국가) 전체 + 여행 폼 셀렉트 국가를 모두 커버한다 */
const MARKETS: Record<string, Market> = {
  JP: { countryCode: "JP", countryName: "일본", currency: "JPY", language: "일본어", gl: "jp", hl: "ja" },
  CN: { countryCode: "CN", countryName: "중국", currency: "CNY", language: "중국어(간체)", gl: "cn", hl: "zh-cn" },
  TW: { countryCode: "TW", countryName: "대만", currency: "TWD", language: "중국어(번체)", gl: "tw", hl: "zh-tw" },
  HK: { countryCode: "HK", countryName: "홍콩", currency: "HKD", language: "중국어(번체) 또는 영어", gl: "hk", hl: "zh-tw" },
  TH: { countryCode: "TH", countryName: "태국", currency: "THB", language: "태국어 또는 영어", gl: "th", hl: "th" },
  VN: { countryCode: "VN", countryName: "베트남", currency: "VND", language: "베트남어 또는 영어", gl: "vn", hl: "vi" },
  PH: { countryCode: "PH", countryName: "필리핀", currency: "PHP", language: "영어", gl: "ph", hl: "en" },
  SG: { countryCode: "SG", countryName: "싱가포르", currency: "SGD", language: "영어", gl: "sg", hl: "en" },
  MY: { countryCode: "MY", countryName: "말레이시아", currency: "MYR", language: "영어", gl: "my", hl: "en" },
  KR: { countryCode: "KR", countryName: "한국", currency: "KRW", language: "한국어", gl: "kr", hl: "ko" },
  US: { countryCode: "US", countryName: "미국", currency: "USD", language: "영어", gl: "us", hl: "en" },
  AU: { countryCode: "AU", countryName: "호주", currency: "AUD", language: "영어", gl: "au", hl: "en" },
  GB: { countryCode: "GB", countryName: "영국", currency: "GBP", language: "영어", gl: "uk", hl: "en" },
  FR: { countryCode: "FR", countryName: "프랑스", currency: "EUR", language: "프랑스어", gl: "fr", hl: "fr" },
  IT: { countryCode: "IT", countryName: "이탈리아", currency: "EUR", language: "이탈리아어", gl: "it", hl: "it" },
  ES: { countryCode: "ES", countryName: "스페인", currency: "EUR", language: "스페인어", gl: "es", hl: "es" },
};

export const DEFAULT_MARKET = MARKETS.JP;

/** 소수점 없이 쓰는 통화 — 가격을 정수로 반올림한다 */
const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "TWD", "VND", "IDR", "HUF", "CLP"]);

export function roundPrice(price: number, currency: string) {
  if (!Number.isFinite(price) || price <= 0) return 0;
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())
    ? Math.round(price)
    : Math.round(price * 100) / 100;
}

export function marketFor(countryCode?: string | null, currency?: string | null): Market {
  const base = MARKETS[(countryCode ?? "").toUpperCase()] ?? DEFAULT_MARKET;
  // 여행 통화가 국가 기본 통화와 다르면 여행 쪽을 우선한다
  return currency && currency !== base.currency ? { ...base, currency } : base;
}
