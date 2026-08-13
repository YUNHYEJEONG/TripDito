export type DemoMapPlace = {
  id: string;
  name: string;
  markerLabel: string;
  category: "쇼핑" | "맛집" | "볼거리";
  city: string;
  address: string;
  summary: string;
  rating: number;
  mapPosition: { x: number; y: number };
  searchTerms: string[];
};

/** Google Maps 키 없이도 지도 탐색 흐름을 확인할 수 있는 교체형 fixture. */
export const DEMO_MAP_PLACES: DemoMapPlace[] = [
  {
    id: "demo-map-donki-shibuya",
    name: "돈키호테 시부야 본점",
    markerLabel: "돈키호테",
    category: "쇼핑",
    city: "도쿄",
    address: "시부야 도겐자카 2-25-8",
    summary: "식품부터 여행용품까지 늦은 시간에도 둘러보기 좋아요.",
    rating: 4.1,
    mapPosition: { x: 29, y: 30 },
    searchTerms: ["돈키호테", "시부야", "드럭스토어", "쇼핑"],
  },
  {
    id: "demo-map-shibuya-parco",
    name: "시부야 PARCO",
    markerLabel: "PARCO",
    category: "쇼핑",
    city: "도쿄",
    address: "시부야 우다가와초 15-1",
    summary: "캐릭터 숍과 패션 브랜드를 한 건물에서 만날 수 있어요.",
    rating: 4.3,
    mapPosition: { x: 67, y: 23 },
    searchTerms: ["파르코", "parco", "시부야", "캐릭터", "쇼핑"],
  },
  {
    id: "demo-map-shibuya-sky",
    name: "시부야 스카이",
    markerLabel: "스카이",
    category: "볼거리",
    city: "도쿄",
    address: "시부야 2-24-12",
    summary: "쇼핑 동선 끝에 야경을 보기 좋은 전망대예요.",
    rating: 4.6,
    mapPosition: { x: 51, y: 47 },
    searchTerms: ["시부야", "스카이", "전망대", "야경", "볼거리"],
  },
  {
    id: "demo-map-hands-shibuya",
    name: "핸즈 시부야점",
    markerLabel: "핸즈",
    category: "쇼핑",
    city: "도쿄",
    address: "시부야 우다가와초 12-18",
    summary: "문구와 생활용품을 층별로 천천히 비교하기 좋아요.",
    rating: 4.2,
    mapPosition: { x: 24, y: 58 },
    searchTerms: ["핸즈", "hands", "문구", "생활용품", "쇼핑"],
  },
  {
    id: "demo-map-ichiran-shibuya",
    name: "이치란 시부야점",
    markerLabel: "이치란",
    category: "맛집",
    city: "도쿄",
    address: "진난 1-22-7",
    summary: "혼자서도 빠르게 식사하기 좋은 돈코츠 라멘 매장이에요.",
    rating: 4.0,
    mapPosition: { x: 74, y: 61 },
    searchTerms: ["이치란", "라멘", "맛집", "시부야"],
  },
];
