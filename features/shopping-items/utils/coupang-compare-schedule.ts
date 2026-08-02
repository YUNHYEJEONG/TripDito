import { isDemoMode } from "@/features/demo/lib/demo-mode";

/** 상품 등록 후 쿠팡 비교까지 대기 시간 */
export const COUPANG_COMPARE_DELAY_MS = 60 * 60 * 1000;

/** 데모 모드: 빠른 확인용 (5초) */
export const COUPANG_COMPARE_DEMO_DELAY_MS = 5 * 1000;

export function getCoupangCompareDelayMs(): number {
  return isDemoMode()
    ? COUPANG_COMPARE_DEMO_DELAY_MS
    : COUPANG_COMPARE_DELAY_MS;
}

export function coupangCompareRunAfterFrom(now = new Date()): string {
  return new Date(now.getTime() + getCoupangCompareDelayMs()).toISOString();
}
