export const HOME_ADS = [
  {
    id: "tokyo",
    href: "/shopping",
    imageSrc: "/ads/home-ad-tokyo.png",
    alt: "도쿄 쇼핑 특가, 면세점과 돈키호테 구경하기",
  },
  {
    id: "taiwan",
    href: "/shopping#coupons",
    imageSrc: "/ads/home-ad-taiwan.png",
    alt: "대만 여행 쿠폰, 야시장과 면세 할인 확인하기",
  },
  {
    id: "osaka",
    href: "https://taxfreecoupon.com/43?category=859686",
    imageSrc: "/ads/home-ad-osaka.png",
    alt: "오사카 패스 특가, 교통과 명소 예약하기",
    external: true,
  },
] as const;

export const HOME_AD_INTERVAL_MS = 3_000;

export function getNextHomeAdIndex(index: number, total: number) {
  if (total <= 0) return 0;
  return (index + 1) % total;
}
