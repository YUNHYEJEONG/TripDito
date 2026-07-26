import type { CurrencyCode } from "@/config/currencies";

/**
 * 국가명(한글) → 기본 통화
 * 인천·김포 등에서 취항하는 주요 국가 기준
 */
export const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  한국: "KRW",
  대한민국: "KRW",
  일본: "JPY",
  중국: "CNY",
  홍콩: "HKD",
  마카오: "MOP",
  대만: "TWD",
  미국: "USD",
  괌: "USD",
  사이판: "USD",
  태국: "THB",
  베트남: "VND",
  필리핀: "PHP",
  싱가포르: "SGD",
  말레이시아: "MYR",
  인도네시아: "IDR",
  호주: "AUD",
  뉴질랜드: "NZD",
  캐나다: "CAD",
  멕시코: "MXN",
  영국: "GBP",
  프랑스: "EUR",
  독일: "EUR",
  이탈리아: "EUR",
  스페인: "EUR",
  네덜란드: "EUR",
  오스트리아: "EUR",
  벨기에: "EUR",
  포르투갈: "EUR",
  핀란드: "EUR",
  아일랜드: "EUR",
  크로아티아: "EUR",
  덴마크: "DKK",
  스위스: "CHF",
  폴란드: "PLN",
  체코: "CZK",
  헝가리: "HUF",
  터키: "TRY",
  아랍에미리트: "AED",
  카타르: "QAR",
  인도: "INR",
  네팔: "NPR",
  스리랑카: "LKR",
  캄보디아: "KHR",
  라오스: "LAK",
  미얀마: "MMK",
  몽골: "MNT",
  카자흐스탄: "KZT",
  우즈베키스탄: "UZS",
  키르기스스탄: "KGS",
  투르크메니스탄: "TMT",
  이스라엘: "ILS",
  에티오피아: "ETB",
  브루나이: "BND",
};

/** 국가명 → 통화 코드 (매핑 없으면 USD) */
export function countryToCurrency(country: string): CurrencyCode {
  const key = country.trim();
  if (COUNTRY_CURRENCY[key]) return COUNTRY_CURRENCY[key];

  // 영문·변형 대비
  if (/일본|japan/i.test(key)) return "JPY";
  if (/미국|usa|united states|괌|사이판/i.test(key)) return "USD";
  if (/중국|china/i.test(key)) return "CNY";
  if (/한국|korea|대한민국/i.test(key)) return "KRW";
  if (/홍콩|hong kong/i.test(key)) return "HKD";
  if (/마카오|macau|macao/i.test(key)) return "MOP";
  if (/대만|taiwan/i.test(key)) return "TWD";
  if (/태국|thailand/i.test(key)) return "THB";
  if (/베트남|vietnam/i.test(key)) return "VND";
  if (/필리핀|philippines/i.test(key)) return "PHP";
  if (/싱가포르|singapore/i.test(key)) return "SGD";
  if (/말레이|malaysia/i.test(key)) return "MYR";
  if (/인도네시아|indonesia/i.test(key)) return "IDR";
  if (/호주|australia/i.test(key)) return "AUD";
  if (/뉴질랜드|new zealand/i.test(key)) return "NZD";
  if (/캐나다|canada/i.test(key)) return "CAD";
  if (/멕시코|mexico/i.test(key)) return "MXN";
  if (/영국|united kingdom|uk\b/i.test(key)) return "GBP";
  if (
    /프랑스|독일|이탈리아|스페인|네덜란드|오스트리아|벨기에|포르투갈|핀란드|아일랜드|크로아티아|france|germany|italy|spain|netherlands|austria|belgium|portugal|finland|ireland|croatia/i.test(
      key,
    )
  ) {
    return "EUR";
  }
  if (/덴마크|denmark/i.test(key)) return "DKK";
  if (/스위스|switzerland/i.test(key)) return "CHF";
  if (/폴란드|poland/i.test(key)) return "PLN";
  if (/체코|czech/i.test(key)) return "CZK";
  if (/헝가리|hungary/i.test(key)) return "HUF";
  if (/터키|turkey|türkiye/i.test(key)) return "TRY";
  if (/아랍에미리트|uae|emirates/i.test(key)) return "AED";
  if (/카타르|qatar/i.test(key)) return "QAR";
  if (/인도\b|india/i.test(key)) return "INR";
  if (/네팔|nepal/i.test(key)) return "NPR";
  if (/스리랑카|sri lanka/i.test(key)) return "LKR";
  if (/캄보디아|cambodia/i.test(key)) return "KHR";
  if (/라오스|laos/i.test(key)) return "LAK";
  if (/미얀마|myanmar|burma/i.test(key)) return "MMK";
  if (/몽골|mongolia/i.test(key)) return "MNT";
  if (/카자흐|kazakhstan/i.test(key)) return "KZT";
  if (/우즈베크|uzbekistan/i.test(key)) return "UZS";
  if (/키르기스|kyrgyz/i.test(key)) return "KGS";
  if (/투르크멘|turkmen/i.test(key)) return "TMT";
  if (/이스라엘|israel/i.test(key)) return "ILS";
  if (/에티오피아|ethiopia/i.test(key)) return "ETB";
  if (/브루나이|brunei/i.test(key)) return "BND";

  return "USD";
}
