import type { Trip } from "../schema";

/** 목록 API 의 품목 집계로 구매 진행률(0~1). 품목이 없으면 undefined */
export function tripProgress(trip: Trip): number | undefined {
  const stats = trip.stats;
  if (!stats || stats.itemCount === 0) return undefined;
  return stats.purchasedCount / stats.itemCount;
}
