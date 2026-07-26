import { appConfig } from "@/config/app";
import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import type { ShoppingItem } from "../schema";
import type { Trip } from "@/features/trips/types";
import type { GiftTagId } from "../constants/gift-tags";
import { getTripStayLength } from "@/features/home/utils/trip-card-meta";
import {
  addDaysIso,
  normalizePlannedPurchaseDates,
} from "../utils/trip-day";

const FLAG_KEY = `${appConfig.storagePrefix}:migrate:shopping-demo-fields-v2`;

/**
 * 기존 로컬 상품에 예상 구매일·선물 대상이 없으면 데모용으로 채웁니다.
 * plannedPurchaseDate(단일) → plannedPurchaseDates(배열)도 정규화합니다.
 */
export function migrateShoppingListDemoFields(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(FLAG_KEY) === "1") return false;

  const trips = getJson<Trip[]>(storageKeys.trips, []);
  const items = getJson<ShoppingItem[]>(storageKeys.items, []);
  if (!items.length) {
    localStorage.setItem(FLAG_KEY, "1");
    return false;
  }

  const tripById = new Map(trips.map((trip) => [trip.id, trip]));
  const giftCycle: GiftTagId[] = ["acquaintance", "colleague", "friend"];
  let changed = false;

  const next = items.map((item, index) => {
    const trip = tripById.get(item.tripId);
    let plannedPurchaseDates = normalizePlannedPurchaseDates(item);
    let giftTags = Array.isArray(item.giftTags) ? [...item.giftTags] : [];
    let touched =
      Array.isArray(item.plannedPurchaseDates) === false ||
      item.plannedPurchaseDate != null;

    if (plannedPurchaseDates.length === 0 && trip) {
      const { days } = getTripStayLength(trip.startDate, trip.endDate);
      const dayOffset = days > 0 ? index % days : 0;
      plannedPurchaseDates = [addDaysIso(trip.startDate, dayOffset)];
      touched = true;
    }

    if (!Array.isArray(item.giftTags)) {
      giftTags = index % 2 === 0 ? [giftCycle[index % giftCycle.length]] : [];
      touched = true;
    }

    if (!touched && plannedPurchaseDates === item.plannedPurchaseDates) {
      return item;
    }
    changed = true;
    const { plannedPurchaseDate: _legacy, ...rest } = item;
    return {
      ...rest,
      plannedPurchaseDates,
      giftTags,
    };
  });

  if (changed) {
    setJson(storageKeys.items, next);
  }
  localStorage.setItem(FLAG_KEY, "1");
  return changed;
}
