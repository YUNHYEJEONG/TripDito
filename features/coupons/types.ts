export type TaxFreeCoupon = {
  id: string;
  /** 카드 타이틀 */
  title: string;
  /** 외부 쿠폰/상세 페이지 URL */
  href: string;
  /** 할인 요약 (표시용, 예: 17% OFF) */
  benefit: string;
  /** 매칭용 국가 */
  country: string;
  /**
   * 매칭용 지역 키워드
   * - 비어 있거나 `전국`이면 해당 국가 전역
   */
  regions: string[];
  /** 현재 제공 중인 쿠폰 여부 */
  active: boolean;
  merchant: string;
};

export type CouponsResponse = {
  sourceUrl: string;
  updatedAt: string | null;
  coupons: TaxFreeCoupon[];
  /** live = 원격 HTML 파싱, fallback = 스냅샷 */
  source: "live" | "fallback";
};
