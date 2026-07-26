/**
 * 홈 여행 카드 배경
 * - 도시 매칭 우선 → 국가 → default
 * 에셋: public/trip-backgrounds/
 */

type BackgroundRule = {
  match: RegExp;
  src: string;
};

const CITY_BACKGROUNDS: BackgroundRule[] = [
  // 일본
  { match: /도쿄|동경|tokyo/i, src: "/trip-backgrounds/tokyo.jpg" },
  { match: /오사카|osaka/i, src: "/trip-backgrounds/osaka.jpg" },
  { match: /오키나와|okinawa|나하|naha/i, src: "/trip-backgrounds/okinawa.jpg" },
  {
    match: /삿포로|sapporo|홋카이도|hokkaido/i,
    src: "/trip-backgrounds/sapporo.jpg",
  },
  { match: /후쿠오카|fukuoka/i, src: "/trip-backgrounds/fukuoka.jpg" },
  // 태국·베트남
  { match: /방콕|bangkok/i, src: "/trip-backgrounds/bangkok.jpg" },
  { match: /푸켓|phuket/i, src: "/trip-backgrounds/phuket.jpg" },
  { match: /다낭|danang|da nang/i, src: "/trip-backgrounds/danang.jpg" },
  { match: /나트랑|nhatrang|nha trang/i, src: "/trip-backgrounds/nhatrang.jpg" },
  {
    match: /호치민|호찌민|hochiminh|ho chi minh|사이공|saigon/i,
    src: "/trip-backgrounds/hochiminh.jpg",
  },
  { match: /하노이|hanoi/i, src: "/trip-backgrounds/hanoi.jpg" },
  // 대만·홍콩·중국
  { match: /타이베이|taipei/i, src: "/trip-backgrounds/taipei.jpg" },
  { match: /홍콩|hong ?kong/i, src: "/trip-backgrounds/hongkong.jpg" },
  { match: /상하이|shanghai/i, src: "/trip-backgrounds/shanghai.jpg" },
  { match: /베이징|북경|beijing/i, src: "/trip-backgrounds/beijing.jpg" },
  // 동남아
  { match: /싱가포르|singapore/i, src: "/trip-backgrounds/singapore.jpg" },
  { match: /세부|cebu/i, src: "/trip-backgrounds/cebu.jpg" },
  { match: /마닐라|manila/i, src: "/trip-backgrounds/manila.jpg" },
  { match: /발리|bali/i, src: "/trip-backgrounds/bali.jpg" },
  {
    match: /쿠알라룸푸르|kuala lumpur|kualalumpur/i,
    src: "/trip-backgrounds/kualalumpur.jpg",
  },
  { match: /자카르타|jakarta/i, src: "/trip-backgrounds/jakarta.jpg" },
  // 미주·대양주
  { match: /괌|guam/i, src: "/trip-backgrounds/guam.jpg" },
  {
    match: /\bLA\b|로스앤젤레스|los angeles/i,
    src: "/trip-backgrounds/la.jpg",
  },
  {
    match: /뉴욕|new ?york|nyc/i,
    src: "/trip-backgrounds/newyork.jpg",
  },
  {
    match: /호놀룰루|honolulu|와이키키|waikiki/i,
    src: "/trip-backgrounds/honolulu.jpg",
  },
  { match: /밴쿠버|vancouver/i, src: "/trip-backgrounds/vancouver.jpg" },
  { match: /시드니|sydney/i, src: "/trip-backgrounds/sydney.jpg" },
  // 유럽·중동
  { match: /파리|paris/i, src: "/trip-backgrounds/paris.jpg" },
  { match: /바르셀로나|barcelona/i, src: "/trip-backgrounds/barcelona.jpg" },
  { match: /로마|rome/i, src: "/trip-backgrounds/rome.jpg" },
  { match: /런던|london/i, src: "/trip-backgrounds/london.jpg" },
  { match: /두바이|dubai/i, src: "/trip-backgrounds/dubai.jpg" },
  // 국내
  { match: /제주|jeju/i, src: "/trip-backgrounds/jeju.jpg" },
  { match: /부산|busan|pusan/i, src: "/trip-backgrounds/busan.jpg" },
];

const COUNTRY_BACKGROUNDS: BackgroundRule[] = [
  { match: /일본|japan|jp\b/i, src: "/trip-backgrounds/japan.jpg" },
  { match: /중국|china|cn\b|중화/i, src: "/trip-backgrounds/china.jpg" },
  { match: /대만|taiwan|tw\b|타이완/i, src: "/trip-backgrounds/taiwan.jpg" },
  { match: /홍콩|hong ?kong/i, src: "/trip-backgrounds/hongkong.jpg" },
  { match: /베트남|vietnam/i, src: "/trip-backgrounds/vietnam.jpg" },
  { match: /태국|thailand/i, src: "/trip-backgrounds/thailand.jpg" },
  { match: /필리핀|philippines/i, src: "/trip-backgrounds/philippines.jpg" },
  { match: /인도네시아|indonesia/i, src: "/trip-backgrounds/indonesia.jpg" },
  { match: /싱가포르|singapore/i, src: "/trip-backgrounds/singapore.jpg" },
  { match: /말레이시아|malaysia/i, src: "/trip-backgrounds/malaysia.jpg" },
  {
    match: /미국|usa|united states|괌|사이판/i,
    src: "/trip-backgrounds/usa.jpg",
  },
  { match: /호주|australia/i, src: "/trip-backgrounds/australia.jpg" },
  { match: /캐나다|canada/i, src: "/trip-backgrounds/canada.jpg" },
  { match: /프랑스|france/i, src: "/trip-backgrounds/france.jpg" },
  { match: /스페인|spain/i, src: "/trip-backgrounds/spain.jpg" },
  { match: /이탈리아|italy/i, src: "/trip-backgrounds/italy.jpg" },
  { match: /독일|germany/i, src: "/trip-backgrounds/germany.jpg" },
  { match: /영국|united kingdom|\buk\b/i, src: "/trip-backgrounds/uk.jpg" },
  {
    match:
      /네덜란드|오스트리아|벨기에|포르투갈|핀란드|아일랜드|크로아티아|체코|헝가리|폴란드|덴마크|스위스|netherlands|austria|belgium|portugal|finland|ireland|croatia|czech|hungary|poland|denmark|switzerland/i,
    src: "/trip-backgrounds/europe.jpg",
  },
  {
    match: /한국|korea|대한민국/i,
    src: "/trip-backgrounds/jeju.jpg",
  },
];

const FALLBACK_BACKGROUND = "/trip-backgrounds/default.jpg";

function matchBackground(
  value: string,
  rules: BackgroundRule[],
): string | null {
  const normalized = value.trim();
  if (!normalized) return null;
  for (const entry of rules) {
    if (entry.match.test(normalized)) return entry.src;
  }
  return null;
}

export function getTripBackgroundSrc(country: string, city?: string): string {
  return (
    matchBackground(city ?? "", CITY_BACKGROUNDS) ??
    matchBackground(country, COUNTRY_BACKGROUNDS) ??
    FALLBACK_BACKGROUND
  );
}

/** start~end 포함 일수 / 박 수 */
export function getTripStayLength(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const days =
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const nights = Math.max(days - 1, 0);
  return { nights, days };
}

export function formatTripStayLabel(startDate: string, endDate: string) {
  const { nights, days } = getTripStayLength(startDate, endDate);
  return `${nights}박 ${days}일`;
}

/** YYYY-MM-DD → YYYY.MM.DD */
export function formatTripDateDot(isoDate: string) {
  if (!isoDate) return "";
  return isoDate.replaceAll("-", ".");
}

export function formatTripDateDotRange(startDate: string, endDate: string) {
  return `${formatTripDateDot(startDate)} ~ ${formatTripDateDot(endDate)}`;
}

/** YYYY-MM-DD → MM.DD */
export function formatTripDateMd(isoDate: string) {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length < 3) return isoDate;
  return `${parts[1]}.${parts[2]}`;
}

/** N박 N일 (MM.DD ~ MM.DD) */
export function formatTripStayWithPeriod(startDate: string, endDate: string) {
  const stay = formatTripStayLabel(startDate, endDate);
  return `${stay} (${formatTripDateMd(startDate)} ~ ${formatTripDateMd(endDate)})`;
}
