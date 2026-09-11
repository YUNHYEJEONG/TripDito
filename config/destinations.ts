/**
 * 여행 국가·도시 선택지
 * - 기준: 한국 항공사(대한항공·아시아나·제주항공·진에어·티웨이·에어부산·에어서울·에어프레미아)의
 *   인천/김해/대구/청주 출발 정기 직항이 있는 국가 중 출국 인기 상위 8개국
 * - 도시는 직항 취항 도시. 같은 공항을 쓰는 대표 관광 도시(교토=간사이, 호이안=다낭 등)는 함께 넣음
 * - currency: 해당 국가 통화 코드. `config/currencies`에 있는 코드면 국가 선택 시 자동 반영
 */
export type Destination = {
  country: string;
  cities: string[];
  currency: string;
};

export const DESTINATIONS: Destination[] = [
  {
    country: "일본",
    cities: [
      "도쿄",
      "오사카",
      "교토",
      "후쿠오카",
      "삿포로",
      "오키나와",
      "나고야",
      "고베",
      "나라",
      "히로시마",
      "가고시마",
      "구마모토",
      "나가사키",
      "벳푸",
      "유후인",
      "기타큐슈",
      "다카마쓰",
      "마쓰야마",
      "오카야마",
      "시즈오카",
      "센다이",
      "니가타",
      "미야자키",
      "아사히카와",
      "요나고",
    ],
    currency: "JPY",
  },
  {
    country: "베트남",
    cities: [
      "다낭",
      "하노이",
      "호치민",
      "나트랑",
      "푸꾸옥",
      "호이안",
      "달랏",
      "하이퐁",
    ],
    currency: "VND",
  },
  {
    country: "중국",
    cities: [
      "상하이",
      "베이징",
      "칭다오",
      "장자제",
      "청두",
      "시안",
      "광저우",
      "선전",
      "항저우",
      "하얼빈",
      "옌지",
      "다롄",
      "웨이하이",
      "옌타이",
      "난징",
      "톈진",
      "선양",
      "충칭",
      "쿤밍",
      "하이난",
    ],
    currency: "CNY",
  },
  { country: "태국", cities: ["방콕", "푸켓", "치앙마이"], currency: "THB" },
  {
    country: "필리핀",
    cities: ["세부", "마닐라", "보라카이", "보홀", "클락"],
    currency: "PHP",
  },
  {
    country: "대만",
    cities: ["타이베이", "가오슝", "타이중"],
    currency: "TWD",
  },
  {
    country: "미국",
    cities: [
      "뉴욕",
      "로스앤젤레스",
      "라스베이거스",
      "샌프란시스코",
      "하와이",
      "시애틀",
      "시카고",
      "워싱턴 D.C.",
      "보스턴",
      "댈러스",
      "애틀랜타",
    ],
    currency: "USD",
  },
  { country: "홍콩", cities: ["홍콩"], currency: "HKD" },
];

export const COUNTRY_NAMES = DESTINATIONS.map((d) => d.country);

export function findDestination(country: string): Destination | undefined {
  const key = country.trim();
  return DESTINATIONS.find((d) => d.country === key);
}

/** 국가에 속한 도시 목록. 목록에 없는 국가면 빈 배열 */
export function getCitiesOf(country: string): string[] {
  return findDestination(country)?.cities ?? [];
}
