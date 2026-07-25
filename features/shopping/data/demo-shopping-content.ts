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
    subtitle: "2시간 · 소그룹",
    spot: "도쿄 · 일본",
    country: "일본",
    regions: ["도쿄"],
    imageSrc: "/shopping/tour-shibuya-night.png",
    tone: "bg-[#1B3A4B]",
  },
  {
    id: "tour-2",
    title: "도톤보리 먹거리 투어",
    subtitle: "3시간 · 가이드 포함",
    spot: "오사카 · 일본",
    country: "일본",
    regions: ["오사카"],
    imageSrc: "/shopping/tour-dotonbori-food.png",
    tone: "bg-[#3D2C29]",
  },
  {
    id: "tour-3",
    title: "후쿠오카 야타이 산책",
    subtitle: "저녁 · 현지 맛집",
    spot: "후쿠오카 · 일본",
    country: "일본",
    regions: ["후쿠오카"],
    imageSrc: "/shopping/tour-fukuoka-yatai.png",
    tone: "bg-[#2C3E50]",
  },
];

export const DEMO_RESTAURANTS: ShoppingRecommendItem[] = [
  {
    id: "food-1",
    title: "이치란 라멘 신주쿠",
    subtitle: "톤코츠 · 웨이팅 주의",
    spot: "도쿄 · 일본",
    country: "일본",
    regions: ["도쿄"],
    imageSrc: "/shopping/food-ichiran-ramen.png",
    tone: "bg-[#5C3A21]",
  },
  {
    id: "food-2",
    title: "쿠로몬 시장 초밥",
    subtitle: "현지인 추천 스시",
    spot: "오사카 · 일본",
    country: "일본",
    regions: ["오사카"],
    imageSrc: "/shopping/food-kuromon-sushi.png",
    tone: "bg-[#3A4A3C]",
  },
  {
    id: "food-3",
    title: "하카타 모츠나베",
    subtitle: "저녁 예약 추천",
    spot: "후쿠오카 · 일본",
    country: "일본",
    regions: ["후쿠오카"],
    imageSrc: "/shopping/food-hakata-motsunabe.png",
    tone: "bg-[#4A3728]",
  },
];

export const DEMO_MALLS: ShoppingRecommendItem[] = [
  {
    id: "mall-1",
    title: "돈키호테 시부야",
    subtitle: "야간 쇼핑 · 면세",
    spot: "도쿄 · 일본",
    country: "일본",
    regions: ["도쿄"],
    imageSrc: "/shopping/mall-donki-shibuya.png",
    tone: "bg-[#C45C26]",
  },
  {
    id: "mall-2",
    title: "이온몰 오사카",
    subtitle: "원스톱 쇼핑",
    spot: "오사카 · 일본",
    country: "일본",
    regions: ["오사카"],
    imageSrc: "/shopping/mall-aeon-osaka.png",
    tone: "bg-[#2F6B4F]",
  },
  {
    id: "mall-3",
    title: "빅카메라 아키하바라",
    subtitle: "가전 · 카메라",
    spot: "도쿄 · 일본",
    country: "일본",
    regions: ["도쿄"],
    imageSrc: "/shopping/mall-bic-akihabara.png",
    tone: "bg-[#1F4E79]",
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
    tone: "bg-[#E8F1FB]",
  },
  {
    id: "mag-2",
    title: "오사카 하루 코스, 쇼핑부터 야식까지",
    summary: "도톤보리·신사이바시를 효율적으로 도는 동선.",
    tag: "코스",
    country: "일본",
    regions: ["오사카"],
    imageSrc: "/shopping/mag-osaka-day-course.png",
    tone: "bg-[#F7EEE6]",
  },
  {
    id: "mag-3",
    title: "면세 한도 전에 알아둘 카드·영수증 팁",
    summary: "공항 전에 미리 챙기면 줄이 짧아져요.",
    tag: "절약",
    country: "일본",
    regions: ["전국"],
    imageSrc: "/shopping/mag-dutyfree-tips.png",
    tone: "bg-[#EEF6EE]",
  },
];

export const DEMO_SHOPPING_AD: ShoppingAd = {
  id: "ad-osaka-pass-usj",
  title: "오사카 여행의 필수품! 주유패스 & USJ 최저가",
  description:
    "교통부터 인기 명소까지 한 번에 해결! 앱 전용 특가로 예약하고 대기 없이 바로 입장하세요.",
  ctaLabel: "최저가로 예약하기",
  href: "https://taxfreecoupon.com/43?category=859686",
  imageSrc: "/ads/osaka-pass-usj.png",
  tone: "bg-[#0B1220]",
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
