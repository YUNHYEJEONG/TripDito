import { isDemoMode } from "@/features/demo/lib/demo-mode";

export const COUPANG_COMPARE_DELAY_MS = 60 * 60 * 1000;
export const COUPANG_COMPARE_TEST_DELAY_MS = 5 * 1000;

export function getCoupangCompareDelayMs() {
  return isDemoMode()
    ? COUPANG_COMPARE_TEST_DELAY_MS
    : COUPANG_COMPARE_DELAY_MS;
}

export function coupangCompareRunAfterFrom(
  now = new Date(),
  delayMs = getCoupangCompareDelayMs(),
) {
  return new Date(now.getTime() + delayMs).toISOString();
}
