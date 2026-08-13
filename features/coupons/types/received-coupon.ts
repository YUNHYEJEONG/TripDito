import type { TaxFreeCoupon } from "../types";

/** 프로필「내가 받은 쿠폰」에 표시하는 쿠폰 (받은 시각 포함) */
export type ReceivedCoupon = TaxFreeCoupon & {
  receivedAt: string;
};
