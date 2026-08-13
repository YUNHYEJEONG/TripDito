export type ShoppingDestination = {
  city: string;
  country: string;
} | null;

export type ShoppingRecommendItem = {
  id: string;
  title: string;
  subtitle: string;
  spot: string;
  country: string;
  /** 매칭 지역. `전국`이면 해당 국가 전체에서 노출 */
  regions: string[];
  href?: string;
  imageSrc?: string;
  badges?: string[];
  /** 외부 리뷰 출처로 이동한다는 사실만 표시합니다. 점수는 직접 검증하지 않습니다. */
  reviewSourceLabel?: string;
  /** 썸네일 배경 톤 (이미지 없을 때) */
  tone: string;
};

export type ShoppingMagazineItem = {
  id: string;
  title: string;
  summary: string;
  tag: string;
  country: string;
  regions: string[];
  href?: string;
  imageSrc?: string;
  tone: string;
};

export type ShoppingAd = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  /** 배너 이미지 (없으면 텍스트 톤 헤더) */
  imageSrc?: string;
  tone: string;
};

export const DEMO_TOURS: ShoppingRecommendItem[] = [
  {
    id: "tour-1",
    title: "시부야 야경 워킹 투어",
    subtitle: "도심 야경 스폿 찾기",
    spot: "도쿄 · 일본",
    country: "일본",
    regions: ["도쿄"],
    imageSrc: "/shopping/tour-shibuya-night.png",
    reviewSourceLabel: "지도 리뷰 확인",
    href: "https://www.google.com/maps/search/?api=1&query=%EC%8B%9C%EB%B6%80%EC%95%BC+%EC%8A%A4%ED%81%AC%EB%9E%A8%EB%B8%94+%EA%B5%90%EC%B0%A8%EB%A1%9C+%EB%8F%84%EC%BF%84",
    tone: "bg-paper-2",
  },
  {
    id: "tour-2",
    title: "도톤보리 먹거리 투어",
    subtitle: "먹거리 골목 둘러보기",
    spot: "오사카 · 일본",
    country: "일본",
    regions: ["오사카"],
    imageSrc: "/shopping/tour-dotonbori-food.png",
    reviewSourceLabel: "지도 리뷰 확인",
    href: "https://www.google.com/maps/search/?api=1&query=%EB%8F%84%ED%86%A4%EB%B3%B4%EB%A6%AC+%EC%98%A4%EC%82%AC%EC%B9%B4",
    tone: "bg-paper-2",
  },
  {
    id: "tour-3",
    title: "후쿠오카 야타이 산책",
    subtitle: "포장마차 거리 찾아보기",
    spot: "후쿠오카 · 일본",
    country: "일본",
    regions: ["후쿠오카"],
    imageSrc: "/shopping/tour-fukuoka-yatai.png",
    reviewSourceLabel: "지도 리뷰 확인",
    href: "https://www.google.com/maps/search/?api=1&query=%ED%9B%84%EC%BF%A0%EC%98%A4%EC%B9%B4+%EC%95%BC%ED%83%80%EC%9D%B4+%EA%B1%B0%EB%A6%AC",
    tone: "bg-paper-2",
  },
];

export const DEMO_RESTAURANTS: ShoppingRecommendItem[] = [
  {
    id: "food-1",
    title: "이치란 라멘 신주쿠",
    subtitle: "톤코츠 라멘 매장 정보",
    spot: "도쿄 · 일본",
    country: "일본",
    regions: ["도쿄"],
    imageSrc: "/shopping/food-ichiran-ramen.png",
    reviewSourceLabel: "지도 리뷰 확인",
    href: "https://www.google.com/maps/search/?api=1&query=%EC%9D%B4%EC%B9%98%EB%9E%80+%EB%9D%BC%EB%A9%98+%EC%8B%A0%EC%A3%BC%EC%BF%A0",
    tone: "bg-paper-2",
  },
  {
    id: "food-2",
    title: "쿠로몬 시장 초밥",
    subtitle: "시장 안 스시 매장 찾기",
    spot: "오사카 · 일본",
    country: "일본",
    regions: ["오사카"],
    imageSrc: "/shopping/food-kuromon-sushi.png",
    reviewSourceLabel: "지도 리뷰 확인",
    href: "https://www.google.com/maps/search/?api=1&query=%EC%BF%A0%EB%A1%9C%EB%AA%AC+%EC%8B%9C%EC%9E%A5+%EC%B4%88%EB%B0%A5",
    tone: "bg-paper-2",
  },
  {
    id: "food-3",
    title: "하카타 모츠나베",
    subtitle: "모츠나베 식당 찾기",
    spot: "후쿠오카 · 일본",
    country: "일본",
    regions: ["후쿠오카"],
    imageSrc: "/shopping/food-hakata-motsunabe.png",
    reviewSourceLabel: "지도 리뷰 확인",
    href: "https://www.google.com/maps/search/?api=1&query=%ED%95%98%EC%B9%B4%ED%83%80+%EB%AA%A8%EC%B8%A0%EB%82%98%EB%B2%A0",
    tone: "bg-paper-2",
  },
];

export const DEMO_MALLS: ShoppingRecommendItem[] = [
  {
    id: "mall-1",
    title: "돈키호테 시부야",
    subtitle: "잡화·식품 매장 정보",
    spot: "도쿄 · 일본",
    country: "일본",
    regions: ["도쿄"],
    imageSrc: "/shopping/mall-donki-shibuya.png",
    badges: ["매장 정보"],
    reviewSourceLabel: "지도 리뷰 확인",
    href: "https://www.google.com/maps/search/?api=1&query=MEGA+%EB%8F%88%ED%82%A4%ED%98%B8%ED%85%8C+%EC%8B%9C%EB%B6%80%EC%95%BC",
    tone: "bg-paper-2",
  },
  {
    id: "mall-2",
    title: "이온몰 오사카 돔시티",
    subtitle: "매장·교통 정보",
    spot: "오사카 · 일본",
    country: "일본",
    regions: ["오사카"],
    imageSrc: "/shopping/mall-aeon-osaka.png",
    badges: ["매장 정보"],
    reviewSourceLabel: "지도 리뷰 확인",
    href: "https://www.google.com/maps/search/?api=1&query=%EC%9D%B4%EC%98%A8%EB%AA%B0+%EC%98%A4%EC%82%AC%EC%B9%B4+%EB%8F%94%EC%8B%9C%ED%8B%B0",
    tone: "bg-paper-2",
  },
  {
    id: "mall-3",
    title: "빅카메라 AKIBA",
    subtitle: "가전·카메라 매장 정보",
    spot: "도쿄 · 일본",
    country: "일본",
    regions: ["도쿄"],
    imageSrc: "/shopping/mall-bic-akihabara.png",
    badges: ["매장 정보"],
    reviewSourceLabel: "지도 리뷰 확인",
    href: "https://www.google.com/maps/search/?api=1&query=%EB%B9%85%EC%B9%B4%EB%A9%94%EB%9D%BC+AKIBA",
    tone: "bg-paper-2",
  },
];

export const DEMO_MAGAZINES: ShoppingMagazineItem[] = [
  {
    id: "mag-1",
    title: "일본 드럭스토어 쇼핑 체크리스트",
    summary: "마츠키요·다이코쿠에서 꼭 살 리스트만 모았어요.",
    tag: "쇼핑팁",
    country: "일본",
    regions: ["전국"],
    imageSrc: "/shopping/mag-drugstore-checklist.png",
    tone: "bg-paper-2",
  },
  {
    id: "mag-2",
    title: "오사카 하루 코스, 쇼핑부터 야식까지",
    summary: "도톤보리·신사이바시를 효율적으로 도는 동선.",
    tag: "코스",
    country: "일본",
    regions: ["오사카"],
    imageSrc: "/shopping/mag-osaka-day-course.png",
    tone: "bg-paper-2",
  },
  {
    id: "mag-3",
    title: "면세 한도 전에 알아둘 카드·영수증 팁",
    summary: "공항 전에 미리 챙기면 줄이 짧아져요.",
    tag: "절약",
    country: "일본",
    regions: ["전국"],
    imageSrc: "/shopping/mag-dutyfree-tips.png",
    tone: "bg-paper-2",
  },
];

export const DEMO_SHOPPING_AD: ShoppingAd = {
  id: "ad-osaka-pass-usj",
  title: "USJ 입장권 정보",
  description: "입장권 가격과 이용 조건을 예약 페이지에서 확인해 보세요.",
  ctaLabel: "USJ 예약 정보 보기",
  href: "https://taxfreecoupon.com/43?category=859686",
  tone: "bg-ink",
};

/** 쇼핑 탭에서 고를 수 있는 기본 여행지 목록 */
export const SHOPPING_DESTINATION_OPTIONS: { city: string; country: string }[] =
  [
    { city: "도쿄", country: "일본" },
    { city: "오사카", country: "일본" },
    { city: "후쿠오카", country: "일본" },
    { city: "홋카이도", country: "일본" },
    { city: "삿포로", country: "일본" },
  ];
