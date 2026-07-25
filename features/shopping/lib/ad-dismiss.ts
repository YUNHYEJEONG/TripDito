import { getJson, removeKey, setJson } from "@/lib/storage/local-storage";

/** 키를 바꾸면 이전 '오늘 하루 보지 않기' 기록이 무효화되어 팝업이 다시 노출됩니다. */
const STORAGE_KEY = "shopping.ad.hideUntilDate.v2";
const LEGACY_KEYS = ["shopping.ad.hideUntilDate"];

function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function clearLegacyHideFlags() {
  for (const key of LEGACY_KEYS) {
    removeKey(key);
  }
}

/** 오늘 하루 보지 않기가 적용 중이면 true */
export function isShoppingAdHiddenToday() {
  clearLegacyHideFlags();
  const hideUntil = getJson<string | null>(STORAGE_KEY, null);
  if (!hideUntil) return false;
  return hideUntil >= todayKey();
}

export function hideShoppingAdForToday() {
  setJson(STORAGE_KEY, todayKey());
}

/** 광고 팝업을 다시 노출할 때 사용 */
export function clearShoppingAdHide() {
  clearLegacyHideFlags();
  removeKey(STORAGE_KEY);
}
