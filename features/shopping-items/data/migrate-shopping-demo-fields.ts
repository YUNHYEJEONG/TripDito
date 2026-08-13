import {
  getJson,
  resolveLocalStorageKey,
  setJson,
} from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import type { CoupangCompareStatus, ShoppingItem } from "../schema";
import { normalizePlannedPurchaseDates } from "../utils/trip-day";

export const SHOPPING_COMPAT_MIGRATION_FLAG_KEY =
  storageKeys.shoppingCompatMigration;

const COUPANG_STATUSES = new Set<CoupangCompareStatus>([
  "pending",
  "checking",
  "done",
  "failed",
]);

function normalizeForMigration(item: ShoppingItem): ShoppingItem {
  const plannedPurchaseDates = normalizePlannedPurchaseDates(item);
  const existingSingle =
    typeof item.plannedPurchaseDate === "string" && item.plannedPurchaseDate.trim()
      ? item.plannedPurchaseDate.trim()
      : null;
  const status = COUPANG_STATUSES.has(
    item.coupangCompareStatus as CoupangCompareStatus,
  )
    ? item.coupangCompareStatus
    : "done";

  return {
    ...item,
    plannedPurchaseDates,
    // 이미 쓰던 단일 값은 덮어쓰지 않고, 배열만 있던 운영 데이터에만 alias를 추가합니다.
    plannedPurchaseDate: existingSingle ?? plannedPurchaseDates[0] ?? null,
    giftTags: Array.isArray(item.giftTags) ? item.giftTags : [],
    localName: item.localName?.trim() || null,
    expectedStores: Array.isArray(item.expectedStores)
      ? item.expectedStores.filter(Boolean)
      : [],
    similarMatchCount:
      typeof item.similarMatchCount === "number" ? item.similarMatchCount : null,
    favorited: item.favorited ?? false,
    priceNeedsReview: item.priceNeedsReview ?? false,
    scheduleNeedsReview: item.scheduleNeedsReview ?? false,
    copiedFromItemId: item.copiedFromItemId ?? null,
    sourceCurrency: item.sourceCurrency ?? null,
    coupangCompareStatus: status,
    coupangCompareRunAfter: item.coupangCompareRunAfter ?? null,
    coupangDeal: item.coupangDeal ?? null,
  };
}

/**
 * 운영판 배열·메타데이터와 현재 브랜치의 단일 구매일을 합치는 단조 증가
 * migration입니다. 필드를 삭제하지 않고, 기존 값이 있으면 그대로 둡니다.
 */
export function migrateShoppingListDemoFields(): boolean {
  if (typeof window === "undefined") return false;
  const migrationKey = resolveLocalStorageKey(SHOPPING_COMPAT_MIGRATION_FLAG_KEY);
  if (window.localStorage.getItem(migrationKey) === "1") {
    return false;
  }

  const items = getJson<ShoppingItem[]>(storageKeys.items, []);
  let changed = false;
  const next = items.map((item) => {
    const normalized = normalizeForMigration(item);
    if (JSON.stringify(normalized) !== JSON.stringify(item)) changed = true;
    return normalized;
  });

  if (changed) setJson(storageKeys.items, next);
  window.localStorage.setItem(migrationKey, "1");
  return changed;
}

/** 더 명확한 이름을 새 호출부에서 사용하되 기존 import도 유지합니다. */
export const migrateShoppingItemsForCompatibility =
  migrateShoppingListDemoFields;
