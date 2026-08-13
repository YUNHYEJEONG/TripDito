import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { CURRENCIES, getCurrency } from "../config/currencies";
import { formatCurrency } from "../lib/format/currency";
import { storageKeys } from "../lib/storage/keys";
import type { ShoppingItem } from "../features/shopping-items/schema";
import { itemRepository } from "../features/shopping-items/data/item-repository";
import {
  migrateShoppingItemsForCompatibility,
  SHOPPING_COMPAT_MIGRATION_FLAG_KEY,
} from "../features/shopping-items/data/migrate-shopping-demo-fields";
import {
  getTripDayNumbers,
  normalizePlannedPurchaseDates,
} from "../features/shopping-items/utils/trip-day";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }
}

function rawItem(
  partial: Partial<ShoppingItem> & Pick<ShoppingItem, "id" | "tripId">,
): ShoppingItem {
  const { id, tripId, ...rest } = partial;
  return {
    id,
    tripId,
    name: "말차 초콜릿",
    estimatedPrice: 1200,
    quantity: 1,
    memo: "",
    imageDataUrl: null,
    plannedPurchaseDate: null,
    giftTags: [],
    purchased: false,
    purchasedAt: null,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...rest,
  };
}

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage },
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

describe("currency compatibility", () => {
  it("keeps the full production currency catalog", () => {
    assert.equal(CURRENCIES.length, 41);
    for (const code of ["HKD", "THB", "VND", "SGD", "DKK"]) {
      assert.equal(getCurrency(code).code, code);
    }
  });

  it("never substitutes KRW for an unknown ISO code", () => {
    assert.equal(getCurrency("ZZZ").code, "ZZZ");
    const formatted = formatCurrency(1234, "ZZZ");
    assert.match(formatted, /ZZZ/);
    assert.doesNotMatch(formatted, /₩|KRW/);
  });
});

describe("shopping purchase-date compatibility", () => {
  it("merges array and single fields without dropping either value", () => {
    assert.deepEqual(
      normalizePlannedPurchaseDates({
        plannedPurchaseDates: ["2026-03-03", "2026-03-02"],
        plannedPurchaseDate: "2026-03-04",
      }),
      ["2026-03-02", "2026-03-03", "2026-03-04"],
    );
    assert.deepEqual(
      getTripDayNumbers("2026-03-02", "2026-03-05", [
        "2026-03-02",
        "2026-03-04",
      ]),
      [1, 3],
    );
  });

  it("migrates production metadata monotonically and remains idempotent", () => {
    const legacy = rawItem({
      id: "legacy",
      tripId: "source",
      plannedPurchaseDate: null,
      plannedPurchaseDates: ["2026-03-02", "2026-03-04"],
      localName: "抹茶チョコレート",
      expectedStores: ["돈키호테"],
      favorited: true,
      coupangDeal: {
        title: "국내 대체 상품",
        unitPriceKrw: 9000,
        url: "https://example.com/deal",
        checkedAt: "2026-01-02T00:00:00.000Z",
      },
    });
    storage.setItem(storageKeys.items, JSON.stringify([legacy]));

    assert.equal(migrateShoppingItemsForCompatibility(), true);
    const migrated = JSON.parse(storage.getItem(storageKeys.items) ?? "[]")[0];
    assert.deepEqual(migrated.plannedPurchaseDates, [
      "2026-03-02",
      "2026-03-04",
    ]);
    assert.equal(migrated.plannedPurchaseDate, "2026-03-02");
    assert.equal(migrated.localName, "抹茶チョコレート");
    assert.deepEqual(migrated.expectedStores, ["돈키호테"]);
    assert.equal(migrated.favorited, true);
    assert.equal(migrated.coupangDeal.title, "국내 대체 상품");
    assert.equal(migrated.coupangCompareStatus, "done");
    assert.equal(migrated.coupangCompareRunAfter, null);
    assert.equal(storage.getItem(SHOPPING_COMPAT_MIGRATION_FLAG_KEY), "1");

    const snapshot = storage.getItem(storageKeys.items);
    assert.equal(migrateShoppingItemsForCompatibility(), false);
    assert.equal(storage.getItem(storageKeys.items), snapshot);
  });
});

describe("copy-to-trip compatibility", () => {
  beforeEach(() => {
    storage.setItem(
      storageKeys.trips,
      JSON.stringify([
        {
          id: "source",
          name: "도쿄",
          country: "일본",
          city: "도쿄",
          startDate: "2026-03-01",
          endDate: "2026-03-05",
          currency: "JPY",
          budget: 100000,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "same",
          name: "오사카",
          country: "일본",
          city: "오사카",
          startDate: "2026-03-02",
          endDate: "2026-03-06",
          currency: "JPY",
          budget: 100000,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "different",
          name: "파리",
          country: "프랑스",
          city: "파리",
          startDate: "2026-04-01",
          endDate: "2026-04-03",
          currency: "EUR",
          budget: 1000,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
    );
    storage.setItem(
      storageKeys.items,
      JSON.stringify([
        rawItem({
          id: "product",
          tripId: "source",
          plannedPurchaseDate: "2026-03-03",
          plannedPurchaseDates: ["2026-03-03"],
          localName: "抹茶チョコレート",
          expectedStores: ["돈키호테"],
        }),
      ]),
    );
  });

  it("preserves price, valid dates, and metadata for the same currency", () => {
    const copied = itemRepository.copyToTrip("product", "same");
    assert.equal(copied.estimatedPrice, 1200);
    assert.deepEqual(copied.plannedPurchaseDates, ["2026-03-03"]);
    assert.equal(copied.localName, "抹茶チョコレート");
    assert.deepEqual(copied.expectedStores, ["돈키호테"]);
    assert.equal(copied.priceNeedsReview, false);
    assert.equal(copied.scheduleNeedsReview, false);
  });

  it("marks incompatible price and schedule for explicit review", () => {
    const copied = itemRepository.copyToTrip("product", "different");
    assert.equal(copied.estimatedPrice, 0);
    assert.deepEqual(copied.plannedPurchaseDates, []);
    assert.equal(copied.priceNeedsReview, true);
    assert.equal(copied.scheduleNeedsReview, true);
    assert.equal(copied.sourceCurrency, "JPY");
  });
});
