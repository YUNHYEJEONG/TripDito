import type { CurrencyCode } from "@/config/currencies";
import { countryToCurrency } from "@/features/trips/lib/country-currency";

export type Destination = {
  city: string;
  country: string;
  currency: CurrencyCode;
};

export type TripRegion = "overseas" | "domestic";
export const DOMESTIC_COUNTRY = "한국";

export function isDomesticCountry(country: string) {
  const key = country.trim();
  return /^(한국|대한민국)$/i.test(key) || /korea/i.test(key);
}

export function regionFromCountry(country: string): TripRegion {
  return isDomesticCountry(country) ? "domestic" : "overseas";
}

function dest(city: string, country: string): Destination {
  return { city, country, currency: countryToCurrency(country) };
}

export const POPULAR_DESTINATIONS: Destination[] = [
  dest("도쿄", "일본"), dest("오사카", "일본"), dest("후쿠오카", "일본"),
  dest("삿포로", "일본"), dest("오키나와", "일본"), dest("방콕", "태국"),
  dest("다낭", "베트남"), dest("나트랑", "베트남"), dest("호치민", "베트남"),
  dest("타이베이", "대만"), dest("홍콩", "홍콩"), dest("상하이", "중국"),
  dest("베이징", "중국"), dest("싱가포르", "싱가포르"), dest("세부", "필리핀"),
  dest("마닐라", "필리핀"), dest("발리", "인도네시아"), dest("괌", "미국"),
  dest("LA", "미국"), dest("뉴욕", "미국"), dest("시드니", "호주"),
  dest("파리", "프랑스"), dest("바르셀로나", "스페인"), dest("로마", "이탈리아"),
];

const EXTRA_DESTINATIONS: Destination[] = [
  // 일본
  dest("가고시마", "일본"), dest("고베", "일본"), dest("고마쓰", "일본"),
  dest("구마모토", "일본"), dest("기타큐슈", "일본"), dest("나가사키", "일본"),
  dest("나고야", "일본"), dest("니가타", "일본"), dest("다카마쓰", "일본"),
  dest("도쿠시마", "일본"), dest("마쓰야마", "일본"), dest("미야자키", "일본"),
  dest("사가", "일본"), dest("센다이", "일본"), dest("시모지시마", "일본"),
  dest("시즈오카", "일본"), dest("아오모리", "일본"), dest("오이타", "일본"),
  dest("오카야마", "일본"), dest("요나고", "일본"), dest("이시가키", "일본"),
  dest("이바라키", "일본"), dest("하코다테", "일본"), dest("히로시마", "일본"),
  // 중국
  dest("광저우", "중국"), dest("구이린", "중국"), dest("구이양", "중국"),
  dest("난징", "중국"), dest("다롄", "중국"), dest("선양", "중국"),
  dest("선전", "중국"), dest("스자좡", "중국"), dest("시안", "중국"),
  dest("샤먼", "중국"), dest("양저우", "중국"), dest("옌청", "중국"),
  dest("옌지", "중국"), dest("오르도스", "중국"), dest("웨이하이", "중국"),
  dest("원저우", "중국"), dest("우한", "중국"), dest("우시", "중국"),
  dest("자무쓰", "중국"), dest("장자제", "중국"), dest("정저우", "중국"),
  dest("지난", "중국"), dest("창사", "중국"), dest("창춘", "중국"),
  dest("청두", "중국"), dest("충칭", "중국"), dest("칭다오", "중국"),
  dest("쿤밍", "중국"), dest("톈진", "중국"), dest("푸저우", "중국"),
  dest("하얼빈", "중국"), dest("하이커우", "중국"), dest("항저우", "중국"),
  dest("허페이", "중국"),
  // 대만·홍콩·마카오
  dest("가오슝", "대만"), dest("타이중", "대만"), dest("마카오", "마카오"),
  // 동남아
  dest("하노이", "베트남"), dest("하이퐁", "베트남"), dest("푸꾸옥", "베트남"),
  dest("푸켓", "태국"), dest("치앙마이", "태국"), dest("클락", "필리핀"),
  dest("보홀", "필리핀"), dest("칼리보", "필리핀"), dest("보라카이", "필리핀"),
  dest("쿠알라룸푸르", "말레이시아"), dest("코타키나발루", "말레이시아"),
  dest("자카르타", "인도네시아"), dest("마나도", "인도네시아"),
  dest("프놈펜", "캄보디아"), dest("비엔티안", "라오스"), dest("양곤", "미얀마"),
  dest("반다르스리브가완", "브루나이"),
  // 남아시아·중앙아시아
  dest("뉴델리", "인도"), dest("카트만두", "네팔"), dest("콜롬보", "스리랑카"),
  dest("울란바토르", "몽골"), dest("알마티", "카자흐스탄"),
  dest("아스타나", "카자흐스탄"), dest("타슈켄트", "우즈베키스탄"),
  dest("비슈케크", "키르기스스탄"), dest("아슈하바트", "투르크메니스탄"),
  // 미주
  dest("샌프란시스코", "미국"), dest("시애틀", "미국"), dest("애틀랜타", "미국"),
  dest("시카고", "미국"), dest("댈러스", "미국"), dest("보스턴", "미국"),
  dest("워싱턴", "미국"), dest("호놀룰루", "미국"), dest("라스베이거스", "미국"),
  dest("디트로이트", "미국"), dest("미니애폴리스", "미국"), dest("뉴어크", "미국"),
  dest("솔트레이크시티", "미국"), dest("사이판", "사이판"),
  dest("밴쿠버", "캐나다"), dest("토론토", "캐나다"), dest("캘거리", "캐나다"),
  dest("몬트리올", "캐나다"), dest("멕시코시티", "멕시코"),
  // 대양주·유럽
  dest("브리즈번", "호주"), dest("오클랜드", "뉴질랜드"), dest("런던", "영국"),
  dest("프랑크푸르트", "독일"), dest("뮌헨", "독일"), dest("암스테르담", "네덜란드"),
  dest("취리히", "스위스"), dest("빈", "오스트리아"), dest("밀라노", "이탈리아"),
  dest("리스본", "포르투갈"), dest("마드리드", "스페인"), dest("프라하", "체코"),
  dest("부다페스트", "헝가리"), dest("바르샤바", "폴란드"),
  dest("브로츠와프", "폴란드"), dest("코펜하겐", "덴마크"),
  dest("헬싱키", "핀란드"), dest("자그레브", "크로아티아"),
  dest("이스탄불", "터키"),
  // 중동·아프리카
  dest("두바이", "아랍에미리트"), dest("아부다비", "아랍에미리트"),
  dest("도하", "카타르"), dest("텔아비브", "이스라엘"), dest("아디스아바바", "에티오피아"),
];

export const POPULAR_DOMESTIC_DESTINATIONS: Destination[] = [
  dest("서울", DOMESTIC_COUNTRY), dest("부산", DOMESTIC_COUNTRY),
  dest("제주", DOMESTIC_COUNTRY), dest("강릉", DOMESTIC_COUNTRY),
  dest("경주", DOMESTIC_COUNTRY), dest("전주", DOMESTIC_COUNTRY),
  dest("여수", DOMESTIC_COUNTRY), dest("속초", DOMESTIC_COUNTRY),
];

const EXTRA_DOMESTIC_DESTINATIONS: Destination[] = [
  dest("인천", DOMESTIC_COUNTRY), dest("대구", DOMESTIC_COUNTRY),
  dest("광주", DOMESTIC_COUNTRY), dest("통영", DOMESTIC_COUNTRY),
];

function mergeDestinations(primary: Destination[], extra: Destination[]) {
  const byKey = new Map<string, Destination>();
  for (const value of [...primary, ...extra]) {
    byKey.set(`${value.country}::${value.city}`, value);
  }
  return [...byKey.values()].sort(
    (a, b) =>
      a.country.localeCompare(b.country, "ko") ||
      a.city.localeCompare(b.city, "ko"),
  );
}

export const OVERSEAS_DESTINATIONS = mergeDestinations(
  POPULAR_DESTINATIONS,
  EXTRA_DESTINATIONS,
);
export const DOMESTIC_DESTINATIONS = mergeDestinations(
  POPULAR_DOMESTIC_DESTINATIONS,
  EXTRA_DOMESTIC_DESTINATIONS,
);
export const FLIGHT_DESTINATIONS = mergeDestinations(
  OVERSEAS_DESTINATIONS,
  DOMESTIC_DESTINATIONS,
);

export function destinationsForRegion(region: TripRegion) {
  return region === "domestic" ? DOMESTIC_DESTINATIONS : OVERSEAS_DESTINATIONS;
}

export function popularDestinationsForRegion(region: TripRegion) {
  return region === "domestic"
    ? POPULAR_DOMESTIC_DESTINATIONS
    : POPULAR_DESTINATIONS;
}

export function listDestinationCountries() {
  return [...new Set(FLIGHT_DESTINATIONS.map((value) => value.country))].sort(
    (a, b) => a.localeCompare(b, "ko"),
  );
}
