import type { Shot } from "@/features/shots/schema";
import type { Trip } from "@/features/trips/schema";
import { createId } from "@/lib/storage/id";
import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import type {
  CoupangCompareStatus,
  CoupangDeal,
  ShoppingItem,
  ShoppingItemFormValues,
} from "../schema";
import { coupangCompareRunAfterFrom } from "../utils/coupang-compare-schedule";
import { normalizePlannedPurchaseDates } from "../utils/trip-day";

function normalizeCoupangFields(item: ShoppingItem) {
  return {
    // 누락 필드를 pending으로 만들면 기존 상품 전부가 외부 검색 대상이 됩니다.
    // 새로 생성한 상품만 명시적 pending으로 scanner에 진입합니다.
    coupangCompareStatus: item.coupangCompareStatus ?? "done",
    coupangCompareRunAfter: item.coupangCompareRunAfter ?? null,
    coupangDeal: item.coupangDeal ?? null,
  } satisfies {
    coupangCompareStatus: CoupangCompareStatus;
    coupangCompareRunAfter: string | null;
    coupangDeal: CoupangDeal | null;
  };
}

function normalizeItem(item: ShoppingItem): ShoppingItem {
  const plannedPurchaseDates = normalizePlannedPurchaseDates(item);
  return {
    ...item,
    plannedPurchaseDates,
    plannedPurchaseDate: plannedPurchaseDates[0] ?? null,
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
    ...normalizeCoupangFields(item),
  };
}

function readItems(): ShoppingItem[] {
  return getJson<ShoppingItem[]>(storageKeys.items, []).map(normalizeItem);
}

/** canonical 배열과 단일 alias를 함께 기록해 구·신 UI 모두 안전하게 읽습니다. */
function writeItems(items: ShoppingItem[]) {
  setJson(
    storageKeys.items,
    items.map((rawItem) => {
      const item = normalizeItem(rawItem);
      return {
        ...item,
        plannedPurchaseDates: item.plannedPurchaseDates ?? [],
        plannedPurchaseDate: item.plannedPurchaseDate ?? null,
      };
    }),
  );
}

function unlinkShoppingItemsFromShots(itemIds: string[]) {
  if (itemIds.length === 0) return;
  const removed = new Set(itemIds);
  const shots = getJson<Shot[]>(storageKeys.shots, []);
  let changed = false;
  const next = shots.map((shot) => {
    const currentIds = Array.isArray(shot.shoppingItemIds)
      ? shot.shoppingItemIds
      : [];
    const shoppingItemIds = currentIds.filter((id) => !removed.has(id));
    if (shoppingItemIds.length === currentIds.length) return shot;
    changed = true;
    return {
      ...shot,
      shoppingItemIds,
      updatedAt: new Date().toISOString(),
    };
  });
  if (changed) setJson(storageKeys.shots, next);
}

function addIsoDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function isoDayDistance(from: string, to: string) {
  return Math.round(
    (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) /
      86_400_000,
  );
}

function getTripForCopy(id: string) {
  return getJson<Trip[]>(storageKeys.trips, []).find((trip) => trip.id === id);
}

function isDateInsideTrip(date: string, trip: Trip) {
  return date >= trip.startDate && date <= trip.endDate;
}

function buildItem(
  tripId: string,
  input: ShoppingItemFormValues,
  options: {
    purchased?: boolean;
    purchasedAt?: string;
    sortOrder?: number;
    now?: string;
  } = {},
): ShoppingItem {
  const now = options.now ?? new Date().toISOString();
  const purchased = options.purchased ?? false;
  const plannedPurchaseDates = normalizePlannedPurchaseDates(input);
  return normalizeItem({
    ...input,
    memo: input.memo ?? "",
    imageDataUrl: input.imageDataUrl ?? null,
    plannedPurchaseDates,
    plannedPurchaseDate: plannedPurchaseDates[0] ?? null,
    giftTags: input.giftTags ?? [],
    localName: input.localName ?? null,
    expectedStores: input.expectedStores ?? [],
    similarMatchCount: input.similarMatchCount ?? null,
    favorited: input.favorited ?? false,
    priceNeedsReview: input.priceNeedsReview ?? false,
    scheduleNeedsReview: input.scheduleNeedsReview ?? false,
    copiedFromItemId: input.copiedFromItemId ?? null,
    sourceCurrency: input.sourceCurrency ?? null,
    id: createId(),
    tripId,
    purchased,
    purchasedAt: purchased ? (options.purchasedAt ?? now) : null,
    sortOrder: options.sortOrder ?? Date.now(),
    createdAt: now,
    updatedAt: now,
    coupangCompareStatus: "pending",
    coupangCompareRunAfter: coupangCompareRunAfterFrom(new Date(now)),
    coupangDeal: null,
  });
}

export const itemRepository = {
  listByTrip(tripId: string): ShoppingItem[] {
    return readItems()
      .filter((item) => item.tripId === tripId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },

  listAll(): ShoppingItem[] {
    return readItems();
  },

  getById(id: string): ShoppingItem | undefined {
    return readItems().find((item) => item.id === id);
  },

  create(
    tripId: string,
    input: ShoppingItemFormValues,
    options: { purchased?: boolean; purchasedAt?: string } = {},
  ): ShoppingItem {
    const item = buildItem(tripId, input, options);
    writeItems([item, ...readItems()]);
    return item;
  },

  /**
   * 다른 사람의 상품을 퍼올 때 같은 통화의 가격만 그대로 사용하고,
   * 대상 여행 기간 안에 있는 구매일만 보존합니다. 확인이 필요한 값은
   * 카드에 명시해 사용자가 무음 데이터 손실을 겪지 않게 합니다.
   */
  copyToTrip(sourceItemId: string, targetTripId: string): ShoppingItem {
    const source = readItems().find((item) => item.id === sourceItemId);
    if (!source) throw new Error("상품을 찾을 수 없어요");

    const sourceTrip = getTripForCopy(source.tripId);
    const targetTrip = getTripForCopy(targetTripId);
    const sameCurrency = Boolean(
      sourceTrip &&
        targetTrip &&
        sourceTrip.currency.toUpperCase() === targetTrip.currency.toUpperCase(),
    );
    const sourceDates = normalizePlannedPurchaseDates(source);
    const plannedPurchaseDates = targetTrip
      ? sourceDates.filter((date) => isDateInsideTrip(date, targetTrip))
      : [];

    return this.create(targetTripId, {
      name: source.name,
      estimatedPrice: sameCurrency ? source.estimatedPrice : 0,
      quantity: source.quantity,
      memo: source.memo,
      imageDataUrl: source.imageDataUrl,
      plannedPurchaseDate: plannedPurchaseDates[0] ?? null,
      plannedPurchaseDates,
      giftTags: source.giftTags ?? [],
      localName: source.localName ?? null,
      expectedStores: source.expectedStores ?? [],
      similarMatchCount: source.similarMatchCount ?? null,
      favorited: false,
      priceNeedsReview: !sameCurrency,
      scheduleNeedsReview: plannedPurchaseDates.length !== sourceDates.length,
      copiedFromItemId: source.id,
      sourceCurrency: sourceTrip?.currency ?? source.sourceCurrency ?? null,
    });
  },

  copyManyToTrip(sourceItemIds: string[], targetTripId: string): ShoppingItem[] {
    return sourceItemIds.map((id) => this.copyToTrip(id, targetTripId));
  },

  createMany(
    tripId: string,
    inputs: ShoppingItemFormValues[],
    options: { purchased?: boolean; purchasedAt?: string } = {},
  ): ShoppingItem[] {
    const now = new Date().toISOString();
    const created = inputs.map((input, index) =>
      buildItem(tripId, input, {
        purchased: options.purchased,
        purchasedAt: options.purchasedAt,
        sortOrder: Date.now() + index,
        now,
      }),
    );
    writeItems([...created, ...readItems()]);
    return created;
  },

  listDueCoupangCompare(now = new Date()): ShoppingItem[] {
    const nowMs = now.getTime();
    return readItems().filter((item) => {
      if (item.coupangCompareStatus !== "pending") return false;
      if (!item.coupangCompareRunAfter) return false;
      return new Date(item.coupangCompareRunAfter).getTime() <= nowMs;
    });
  },

  acceleratePendingCoupangCompare(now = new Date()): number {
    const items = readItems();
    const runAfter = new Date(now.getTime() - 1000).toISOString();
    let count = 0;
    const next = items.map((item) => {
      if (item.coupangCompareStatus !== "pending") return item;
      count += 1;
      return { ...item, coupangCompareRunAfter: runAfter, updatedAt: now.toISOString() };
    });
    if (count > 0) writeItems(next);
    return count;
  },

  setCoupangCompareStatus(
    id: string,
    status: CoupangCompareStatus,
  ): ShoppingItem {
    const items = readItems();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("상품을 찾을 수 없어요");
    const updated = normalizeItem({
      ...items[index],
      coupangCompareStatus: status,
      updatedAt: new Date().toISOString(),
    });
    items[index] = updated;
    writeItems(items);
    return updated;
  },

  setCoupangCompareResult(
    id: string,
    result: {
      status: Extract<CoupangCompareStatus, "done" | "failed">;
      deal: CoupangDeal | null;
    },
  ): ShoppingItem {
    const items = readItems();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("상품을 찾을 수 없어요");
    const updated = normalizeItem({
      ...items[index],
      coupangCompareStatus: result.status,
      coupangDeal: result.deal,
      updatedAt: new Date().toISOString(),
    });
    items[index] = updated;
    writeItems(items);
    return updated;
  },

  update(id: string, input: ShoppingItemFormValues): ShoppingItem {
    const items = readItems();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("상품을 찾을 수 없어요");
    const current = items[index];
    const plannedPurchaseDates = normalizePlannedPurchaseDates(input);
    const comparisonChanged =
      current.name !== input.name || current.estimatedPrice !== input.estimatedPrice;
    const updated = normalizeItem({
      ...current,
      ...input,
      memo: input.memo ?? "",
      imageDataUrl: input.imageDataUrl ?? null,
      plannedPurchaseDates,
      plannedPurchaseDate: plannedPurchaseDates[0] ?? null,
      giftTags: input.giftTags ?? [],
      localName:
        input.localName === undefined ? (current.localName ?? null) : input.localName,
      expectedStores:
        input.expectedStores === undefined
          ? (current.expectedStores ?? [])
          : input.expectedStores,
      similarMatchCount:
        input.similarMatchCount === undefined
          ? (current.similarMatchCount ?? null)
          : input.similarMatchCount,
      favorited:
        input.favorited === undefined
          ? (current.favorited ?? false)
          : input.favorited,
      priceNeedsReview: false,
      scheduleNeedsReview: false,
      coupangCompareStatus: comparisonChanged
        ? "pending"
        : current.coupangCompareStatus,
      coupangCompareRunAfter: comparisonChanged
        ? coupangCompareRunAfterFrom()
        : current.coupangCompareRunAfter,
      coupangDeal: comparisonChanged ? null : current.coupangDeal,
      updatedAt: new Date().toISOString(),
    });
    items[index] = updated;
    writeItems(items);
    return updated;
  },

  togglePurchased(id: string): ShoppingItem {
    const items = readItems();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("상품을 찾을 수 없어요");
    const current = items[index];
    const purchased = !current.purchased;
    const updated = normalizeItem({
      ...current,
      purchased,
      purchasedAt: purchased ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });
    items[index] = updated;
    writeItems(items);
    return updated;
  },

  toggleFavorited(id: string): ShoppingItem {
    const items = readItems();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("상품을 찾을 수 없어요");
    const updated = normalizeItem({
      ...items[index],
      favorited: !items[index].favorited,
      updatedAt: new Date().toISOString(),
    });
    items[index] = updated;
    writeItems(items);
    return updated;
  },

  listFavorited(): ShoppingItem[] {
    return readItems()
      .filter((item) => item.favorited)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  remove(id: string) {
    writeItems(readItems().filter((item) => item.id !== id));
    unlinkShoppingItemsFromShots([id]);
  },

  removeByTripId(tripId: string) {
    const items = readItems();
    const removedIds = items
      .filter((item) => item.tripId === tripId)
      .map((item) => item.id);
    writeItems(items.filter((item) => item.tripId !== tripId));
    unlinkShoppingItemsFromShots(removedIds);
  },

  rebasePlannedDates(
    tripId: string,
    previousStartDate: string,
    nextStartDate: string,
    nextEndDate: string,
  ) {
    const items = readItems();
    let changed = false;
    const next = items.map((item) => {
      if (item.tripId !== tripId) return item;
      const currentDates = normalizePlannedPurchaseDates(item);
      if (currentDates.length === 0) return item;
      const rebasedDates = currentDates
        .map((date) => {
          const offset = Math.max(0, isoDayDistance(previousStartDate, date));
          return addIsoDays(nextStartDate, offset);
        })
        .filter((date) => date <= nextEndDate);
      changed = true;
      return normalizeItem({
        ...item,
        plannedPurchaseDates: rebasedDates,
        plannedPurchaseDate: rebasedDates[0] ?? null,
        scheduleNeedsReview: rebasedDates.length !== currentDates.length,
        updatedAt: new Date().toISOString(),
      });
    });
    if (changed) writeItems(next);
  },
};
