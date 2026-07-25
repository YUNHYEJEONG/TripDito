import type { TaxFreeCoupon } from "../types";

/** 프로필「내가 받은 쿠폰」에 표시하는 쿠폰 (받은 시각 포함) */
export type ReceivedCoupon = TaxFreeCoupon & {
  receivedAt: string;
};

/** PoC용 초기 보유 쿠폰 (taxfree 스냅샷 일부) */
export const DEMO_RECEIVED_COUPONS: ReceivedCoupon[] = [
  {
    id: "donki-17",
    title: "돈키호테 17% 할인쿠폰",
    href: "https://japanportal.donki-global.com/coupon/?ptcd=0008000104",
    benefit: "17% OFF",
    country: "일본",
    regions: ["전국"],
    active: true,
    merchant: "돈키호테",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "bic-17",
    title: "빅 카메라 17% 할인쿠폰",
    href: "https://taxfreecoupon.com/34",
    benefit: "17% OFF",
    country: "일본",
    regions: ["전국"],
    active: true,
    merchant: "빅카메라",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "alpen-15",
    title: "알펜 도쿄 후쿠오카 온러닝 호카 나이키 일본에서 더 싸게 쇼핑 15% 할인쿠폰",
    href: "https://taxfreecoupon.com/133",
    benefit: "15% OFF",
    country: "일본",
    regions: ["도쿄", "후쿠오카"],
    active: true,
    merchant: "알펜",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
];
