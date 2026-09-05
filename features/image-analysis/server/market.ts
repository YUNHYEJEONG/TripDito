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

const MARKETS: Record<string, Market> = {
  JP: { countryCode: "JP", countryName: "일본", currency: "JPY", language: "일본어", gl: "jp", hl: "ja" },
  CN: { countryCode: "CN", countryName: "중국", currency: "CNY", language: "중국어(간체)", gl: "cn", hl: "zh-cn" },
  TW: { countryCode: "TW", countryName: "대만", currency: "TWD", language: "중국어(번체)", gl: "tw", hl: "zh-tw" },
  TH: { countryCode: "TH", countryName: "태국", currency: "THB", language: "태국어 또는 영어", gl: "th", hl: "th" },
  KR: { countryCode: "KR", countryName: "한국", currency: "KRW", language: "한국어", gl: "kr", hl: "ko" },
};

export const DEFAULT_MARKET = MARKETS.JP;

export function marketFor(countryCode?: string | null, currency?: string | null): Market {
  const base = MARKETS[(countryCode ?? "").toUpperCase()] ?? DEFAULT_MARKET;
  // 여행 통화가 국가 기본 통화와 다르면 여행 쪽을 우선한다
  return currency && currency !== base.currency ? { ...base, currency } : base;
}
