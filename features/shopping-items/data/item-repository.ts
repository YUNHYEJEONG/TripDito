import { createId } from "@/lib/storage/id";
import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import type { ShoppingItem, ShoppingItemFormValues } from "../schema";
import { normalizePlannedPurchaseDates } from "../utils/trip-day";

function readItems(): ShoppingItem[] {
  return getJson<ShoppingItem[]>(storageKeys.items, []).map((item) => {
    const plannedPurchaseDates = normalizePlannedPurchaseDates(item);
    return {
      ...item,
      plannedPurchaseDates,
      plannedPurchaseDate: undefined,
      localName: item.localName ?? null,
      expectedStores: item.expectedStores ?? [],
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
      id: createId(),
      tripId,
      purchased: false,
      purchasedAt: null,
      sortOrder: Date.now(),
      createdAt: now,
      updatedAt: now,
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
    });
  },

  copyManyToTrip(sourceItemIds: string[], targetTripId: string): ShoppingItem[] {
    return sourceItemIds.map((id) => this.copyToTrip(id, targetTripId));
  },

  createMany(tripId: string, inputs: ShoppingItemFormValues[]): ShoppingItem[] {
    const now = new Date().toISOString();
    const created = inputs.map((input, index) => {
      const item: ShoppingItem = {
        ...input,
        memo: input.memo ?? "",
        imageDataUrl: input.imageDataUrl ?? null,
        plannedPurchaseDates: normalizePlannedPurchaseDates(input),
        giftTags: input.giftTags ?? [],
        localName: input.localName ?? null,
        expectedStores: input.expectedStores ?? [],
        id: createId(),
        tripId,
        purchased: false,
        purchasedAt: null,
        sortOrder: Date.now() + index,
        createdAt: now,
        updatedAt: now,
      };
      return item;
    });
    writeItems([...created, ...readItems()]);
    return created;
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

  remove(id: string) {
    writeItems(readItems().filter((item) => item.id !== id));
  },

  removeByTripId(tripId: string) {
    writeItems(readItems().filter((item) => item.tripId !== tripId));
  },
};
