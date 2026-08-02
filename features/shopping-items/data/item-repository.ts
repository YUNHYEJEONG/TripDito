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

function normalizeCoupangFields(
  item: ShoppingItem,
): Pick<
  ShoppingItem,
  "coupangCompareStatus" | "coupangCompareRunAfter" | "coupangDeal"
> {
  return {
    coupangCompareStatus: item.coupangCompareStatus ?? "done",
    coupangCompareRunAfter: item.coupangCompareRunAfter ?? null,
    coupangDeal: item.coupangDeal ?? null,
  };
}

function readItems(): ShoppingItem[] {
  return getJson<ShoppingItem[]>(storageKeys.items, []).map((item) => {
    const plannedPurchaseDates = normalizePlannedPurchaseDates(item);
    return {
      ...item,
      plannedPurchaseDates,
      plannedPurchaseDate: undefined,
      localName: item.localName ?? null,
      expectedStores: item.expectedStores ?? [],
      favorited: item.favorited ?? false,
      ...normalizeCoupangFields(item),
    };
  });
}

function writeItems(items: ShoppingItem[]) {
  setJson(
    storageKeys.items,
    items.map((item) => {
      const plannedPurchaseDates = normalizePlannedPurchaseDates(item);
      const { plannedPurchaseDate: _legacy, ...rest } = item;
      return {
        ...rest,
        plannedPurchaseDates,
      };
    }),
  );
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

  getById(id: string): ShoppingItem | undefined {
    return readItems().find((item) => item.id === id);
  },

  listAll(): ShoppingItem[] {
    return readItems();
  },

  create(tripId: string, input: ShoppingItemFormValues): ShoppingItem {
    const now = new Date().toISOString();
    const item: ShoppingItem = {
      ...input,
      memo: input.memo ?? "",
      imageDataUrl: input.imageDataUrl ?? null,
      plannedPurchaseDates: normalizePlannedPurchaseDates(input),
      giftTags: input.giftTags ?? [],
      localName: input.localName ?? null,
      expectedStores: input.expectedStores ?? [],
      favorited: input.favorited ?? false,
      id: createId(),
      tripId,
      purchased: false,
      purchasedAt: null,
      sortOrder: Date.now(),
      createdAt: now,
      updatedAt: now,
      coupangCompareStatus: "pending",
      coupangCompareRunAfter: coupangCompareRunAfterFrom(new Date(now)),
      coupangDeal: null,
    };
    writeItems([item, ...readItems()]);
    return item;
  },

  /** 다른 사람 쇼핑리스트 상품을 내 여행 리스트로 퍼가기 */
  copyToTrip(sourceItemId: string, targetTripId: string): ShoppingItem {
    const source = readItems().find((item) => item.id === sourceItemId);
    if (!source) throw new Error("상품을 찾을 수 없습니다.");
    return this.create(targetTripId, {
      name: source.name,
      estimatedPrice: source.estimatedPrice,
      quantity: source.quantity,
      memo: source.memo,
      imageDataUrl: source.imageDataUrl,
      plannedPurchaseDates: source.plannedPurchaseDates ?? [],
      giftTags: source.giftTags ?? [],
      localName: source.localName ?? null,
      expectedStores: source.expectedStores ?? [],
      favorited: false,
    });
  },

  copyManyToTrip(sourceItemIds: string[], targetTripId: string): ShoppingItem[] {
    return sourceItemIds.map((id) => this.copyToTrip(id, targetTripId));
  },

  createMany(tripId: string, inputs: ShoppingItemFormValues[]): ShoppingItem[] {
    const now = new Date().toISOString();
    const runAfter = coupangCompareRunAfterFrom(new Date(now));
    const created = inputs.map((input, index) => {
      const item: ShoppingItem = {
        ...input,
        memo: input.memo ?? "",
        imageDataUrl: input.imageDataUrl ?? null,
        plannedPurchaseDates: normalizePlannedPurchaseDates(input),
        giftTags: input.giftTags ?? [],
        localName: input.localName ?? null,
        expectedStores: input.expectedStores ?? [],
        favorited: input.favorited ?? false,
        id: createId(),
        tripId,
        purchased: false,
        purchasedAt: null,
        sortOrder: Date.now() + index,
        createdAt: now,
        updatedAt: now,
        coupangCompareStatus: "pending",
        coupangCompareRunAfter: runAfter,
        coupangDeal: null,
      };
      return item;
    });
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

  /** 데모 모드 ON: pending 비교를 즉시 실행 가능하도록 runAfter를 과거로 */
  acceleratePendingCoupangCompare(now = new Date()): number {
    const items = readItems();
    const past = new Date(now.getTime() - 1000).toISOString();
    let count = 0;
    const next = items.map((item) => {
      if (item.coupangCompareStatus !== "pending") return item;
      count += 1;
      return {
        ...item,
        coupangCompareRunAfter: past,
        updatedAt: now.toISOString(),
      };
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
    if (index < 0) throw new Error("상품을 찾을 수 없습니다.");
    const updated: ShoppingItem = {
      ...items[index],
      coupangCompareStatus: status,
      updatedAt: new Date().toISOString(),
    };
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
    if (index < 0) throw new Error("상품을 찾을 수 없습니다.");
    const updated: ShoppingItem = {
      ...items[index],
      coupangCompareStatus: result.status,
      coupangDeal: result.deal,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updated;
    writeItems(items);
    return updated;
  },

  update(id: string, input: ShoppingItemFormValues): ShoppingItem {
    const items = readItems();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("상품을 찾을 수 없습니다.");
    const updated: ShoppingItem = {
      ...items[index],
      ...input,
      memo: input.memo ?? "",
      imageDataUrl: input.imageDataUrl ?? null,
      plannedPurchaseDates: normalizePlannedPurchaseDates(input),
      giftTags: input.giftTags ?? [],
      localName: input.localName ?? null,
      expectedStores: input.expectedStores ?? [],
      favorited: input.favorited ?? items[index].favorited ?? false,
      plannedPurchaseDate: undefined,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updated;
    writeItems(items);
    return updated;
  },

  togglePurchased(id: string): ShoppingItem {
    const items = readItems();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("상품을 찾을 수 없습니다.");
    const current = items[index];
    const purchased = !current.purchased;
    const updated: ShoppingItem = {
      ...current,
      purchased,
      purchasedAt: purchased ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updated;
    writeItems(items);
    return updated;
  },

  toggleFavorited(id: string): ShoppingItem {
    const items = readItems();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("상품을 찾을 수 없습니다.");
    const current = items[index];
    const updated: ShoppingItem = {
      ...current,
      favorited: !current.favorited,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updated;
    writeItems(items);
    return updated;
  },

  listFavorited(): ShoppingItem[] {
    return readItems()
      .filter((item) => item.favorited)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  },

  remove(id: string) {
    writeItems(readItems().filter((item) => item.id !== id));
  },

  removeByTripId(tripId: string) {
    writeItems(readItems().filter((item) => item.tripId !== tripId));
  },
};
