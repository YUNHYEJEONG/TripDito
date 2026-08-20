import type { ShoppingItem } from "@/features/shopping-items/types";
import type { HomeMode } from "@/features/home/utils/get-home-mode";
import {
  getTripDayNumbers,
  normalizePlannedPurchaseDates,
} from "@/features/shopping-items/utils/trip-day";

/**
 * 홈 쇼핑리스트의 필터 키. **모드와 무관하게 일차 하나로만** 거른다.
 *
 * 구매 상태(`살 것`·`구매완료`)는 필터로 두지 않는다 — 각 행의 체크박스와 취소선이 이미
 * 상태를 말하고 있고, 제목 옆 숫자가 전체 진행을 요약한다. 같은 정보를 거르는 축으로 또
 * 만들면 칩 줄만 길어진다.
 */
export type HomeListFilter = "all" | `day-${number}`;

export function getHomeShoppingFilterOptions(
  dayNumbers: readonly number[],
): Array<{ key: HomeListFilter; label: string }> {
  return [
    { key: "all", label: "전체" },
    ...dayNumbers.map((day) => ({
      key: `day-${day}` as const,
      label: `${day}일차`,
    })),
  ];
}

export function filterHomeShoppingItems(
  items: ShoppingItem[],
  filter: HomeListFilter,
  trip: { startDate: string; endDate: string },
) {
  if (filter === "all") return items;

  const day = Number(filter.slice(4));
  if (!Number.isFinite(day)) return items;

  return items.filter((item) =>
    getTripDayNumbers(
      trip.startDate,
      trip.endDate,
      normalizePlannedPurchaseDates(item),
    ).includes(day),
  );
}

/**
 * D-7 밖의 여행도 홈에서는 쇼핑 준비 도구를 바로 쓸 수 있다.
 * `idle`은 상태 표현에만 남기고 체크리스트 동작은 준비 모드와 동일하게 연다.
 */
export function getHomeChecklistMode(
  mode: HomeMode,
): Exclude<HomeMode, "idle"> {
  return mode === "idle" ? "prep" : mode;
}

/** 홈에서는 모든 여행 상태를 같은 개수로 접고, 사용자가 명시적으로 펼친다. */
export function getHomeShoppingPreview(
  items: ShoppingItem[],
  limit: number,
  expanded = false,
) {
  return expanded ? items : items.slice(0, Math.max(0, limit));
}
