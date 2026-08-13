import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getCurrentTripDay,
  getDaysUntilTrip,
  getTripHomeMode,
  resolveHomeTrip,
  selectHomeTrip,
} from "../features/home/utils/get-home-mode";
import { todayIsoDate } from "../features/home/utils/get-upcoming-trip";
import { itemRepository } from "../features/shopping-items/data/item-repository";
import type { ShoppingItemFormValues } from "../features/shopping-items/schema";
import type { ShoppingItem } from "../features/shopping-items/types";
import type { Trip } from "../features/trips/types";
import {
  HOME_ADS,
  HOME_AD_INTERVAL_MS,
  getNextHomeAdIndex,
} from "../features/home/data/home-ad-carousel";
import {
  filterHomePurchaseItems,
  getHomeShoppingPreview,
} from "../features/home/utils/home-shopping-list";

function trip(
  id: string,
  startDate: string,
  endDate: string,
): Trip {
  return {
    id,
    name: id,
    country: "일본",
    city: "도쿄",
    startDate,
    endDate,
    currency: "JPY",
    budget: 100_000,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

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
    this.values.set(key, value);
  }
}

function withMemoryStorage(run: (storage: MemoryStorage) => void) {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage },
  });

  try {
    run(storage);
  } finally {
    if (previousWindow) {
      Object.defineProperty(globalThis, "window", previousWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  }
}

function capturedItem(
  plannedPurchaseDate: string | null,
): ShoppingItemFormValues {
  return {
    name: "선크림",
    estimatedPrice: 1_280,
    quantity: 2,
    memo: "사진으로 만든 초안",
    imageDataUrl: "data:image/jpeg;base64,demo",
    plannedPurchaseDate,
    giftTags: [],
  };
}

function savedItem(id: string, purchased: boolean): ShoppingItem {
  return {
    id,
    tripId: "live-trip",
    name: `상품 ${id}`,
    estimatedPrice: 1_000,
    quantity: 1,
    memo: "",
    imageDataUrl: null,
    plannedPurchaseDate: null,
    plannedPurchaseDates: [],
    giftTags: [],
    purchased,
    purchasedAt: purchased ? "2026-08-12T00:00:00.000Z" : null,
    sortOrder: Number(id),
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  };
}

describe("home trip modes", () => {
  it("activates prep only from D-7 through D-1", () => {
    const target = trip("tokyo", "2026-08-12", "2026-08-15");

    assert.equal(getTripHomeMode(target, "2026-08-04"), "idle");
    assert.equal(getTripHomeMode(target, "2026-08-05"), "prep");
    assert.equal(getTripHomeMode(target, "2026-08-11"), "prep");
  });

  it("keeps every completed trip in settlement mode", () => {
    const target = trip("tokyo", "2026-08-12", "2026-08-15");

    assert.equal(getTripHomeMode(target, "2026-08-12"), "live");
    assert.equal(getTripHomeMode(target, "2026-08-15"), "live");
    assert.equal(getTripHomeMode(target, "2026-08-16"), "after");
    assert.equal(getTripHomeMode(target, "2026-08-22"), "after");
    assert.equal(getTripHomeMode(target, "2027-08-23"), "after");
  });

  it("selects live, then only near prep, then most recently ended trip", () => {
    const trips = [
      trip("older-after", "2026-08-01", "2026-08-06"),
      trip("far-future-idle", "2026-08-25", "2026-08-27"),
      trip("later-live", "2026-08-09", "2026-08-15"),
      trip("near-prep", "2026-08-18", "2026-08-22"),
      trip("earlier-live", "2026-08-10", "2026-08-13"),
      trip("recent-after", "2026-08-03", "2026-08-10"),
    ];

    assert.equal(selectHomeTrip(trips, "2026-08-12")?.id, "earlier-live");
    assert.equal(
      selectHomeTrip(
        trips.filter((candidate) => !candidate.id.includes("live")),
        "2026-08-12",
      )?.id,
      "near-prep",
    );
    assert.equal(
      selectHomeTrip(
        trips.filter((candidate) => candidate.id.includes("after")),
        "2026-08-12",
      )?.id,
      "recent-after",
    );
  });

  it("returns no contextual trip when only far-future trips exist", () => {
    const trips = [trip("far-future", "2026-08-20", "2026-08-23")];

    assert.equal(selectHomeTrip(trips, "2026-08-12"), null);
  });

  it("uses the most recently completed trip for settlement history", () => {
    const trips = [
      trip("older-completed", "2025-06-01", "2025-06-05"),
      trip("recent-completed", "2026-07-01", "2026-07-05"),
    ];

    assert.equal(
      selectHomeTrip(trips, "2026-08-12")?.id,
      "recent-completed",
    );
  });

  it("uses deterministic automatic priority for overlapping trips", () => {
    const trips = [
      trip("live-later", "2026-08-11", "2026-08-16"),
      trip("prep-nearest", "2026-08-18", "2026-08-20"),
      trip("live-sooner-b", "2026-08-10", "2026-08-14"),
      trip("live-sooner-a", "2026-08-10", "2026-08-14"),
    ];

    assert.equal(selectHomeTrip(trips, "2026-08-12")?.id, "live-sooner-a");
  });

  it("honors any persisted current or upcoming trip, including idle", () => {
    const trips = [
      trip("live", "2026-08-11", "2026-08-15"),
      trip("chosen-prep", "2026-08-18", "2026-08-20"),
      trip("far-future", "2026-09-01", "2026-09-04"),
    ];

    assert.equal(
      resolveHomeTrip(trips, "chosen-prep", "2026-08-12")?.id,
      "chosen-prep",
    );
    assert.equal(
      resolveHomeTrip(trips, "far-future", "2026-08-12")?.id,
      "far-future",
    );
  });

  it("falls back to automatic priority when the persisted trip was deleted", () => {
    const trips = [
      trip("live", "2026-08-11", "2026-08-15"),
      trip("near-prep", "2026-08-18", "2026-08-20"),
    ];

    assert.equal(
      resolveHomeTrip(trips, "deleted-trip", "2026-08-12")?.id,
      "live",
    );
  });

  it("honors a persisted long-completed trip as settlement context", () => {
    const completed = trip("completed", "2025-08-01", "2025-08-04");

    assert.equal(
      resolveHomeTrip([completed], "completed", "2026-08-12")?.id,
      "completed",
    );
    assert.equal(getTripHomeMode(completed, "2026-08-12"), "after");
  });

  it("uses automatic priority when there is no persisted choice", () => {
    const trips = [
      trip("far-future", "2026-09-01", "2026-09-04"),
      trip("live", "2026-08-11", "2026-08-15"),
    ];

    assert.equal(resolveHomeTrip(trips, null, "2026-08-12")?.id, "live");
  });

  it("calculates D-day and trip day from date-only values", () => {
    const target = trip("osaka", "2026-08-15", "2026-08-18");

    assert.equal(getDaysUntilTrip(target, "2026-08-12"), 3);
    assert.equal(getCurrentTripDay(target, "2026-08-15"), 1);
    assert.equal(getCurrentTripDay(target, "2026-08-17"), 3);
  });

  it("formats a caller-provided local date without UTC date drift", () => {
    const localMidnight = new Date(2026, 7, 12, 0, 5);

    assert.equal(todayIsoDate(localMidnight), "2026-08-12");
  });
});

describe("context action persistence", () => {
  it("keeps prep captures pending while live captures become today's purchases", () => {
    withMemoryStorage(() => {
      const localToday = todayIsoDate(new Date(2026, 7, 12, 9, 0));
      const [prepItem] = itemRepository.createMany("prep-trip", [
        capturedItem(null),
      ]);
      const beforeLiveSave = Date.now();
      const [liveItem] = itemRepository.createMany(
        "live-trip",
        [capturedItem(localToday)],
        { purchased: true },
      );
      const afterLiveSave = Date.now();

      assert.equal(prepItem.tripId, "prep-trip");
      assert.equal(prepItem.plannedPurchaseDate, null);
      assert.equal(prepItem.purchased, false);
      assert.equal(prepItem.purchasedAt, null);

      assert.equal(liveItem.tripId, "live-trip");
      assert.equal(liveItem.plannedPurchaseDate, "2026-08-12");
      assert.equal(liveItem.purchased, true);
      assert.ok(liveItem.purchasedAt);
      assert.equal(liveItem.purchasedAt, liveItem.createdAt);
      assert.ok(Date.parse(liveItem.purchasedAt) >= beforeLiveSave);
      assert.ok(Date.parse(liveItem.purchasedAt) <= afterLiveSave);
      assert.notEqual(prepItem.id, liveItem.id);
    });
  });
});

describe("live home purchase checklist", () => {
  const items = Array.from({ length: 7 }, (_, index) =>
    savedItem(String(index), index < 2),
  );

  it("keeps every home shopping list collapsed until explicitly expanded", () => {
    assert.equal(getHomeShoppingPreview(items, 3).length, 3);
    assert.equal(getHomeShoppingPreview(items, 3, true).length, 7);
    assert.equal(getHomeShoppingPreview(items, 0).length, 0);
  });

  it("separates planned items and completed purchase history", () => {
    assert.equal(filterHomePurchaseItems(items, "all").length, 7);
    assert.equal(filterHomePurchaseItems(items, "pending").length, 5);
    assert.equal(filterHomePurchaseItems(items, "purchased").length, 2);
  });
});

describe("operating home ad carousel", () => {
  it("restores the three original assets and cycles every three seconds", () => {
    assert.equal(HOME_ADS.length, 3);
    assert.deepEqual(
      HOME_ADS.map((ad) => ad.imageSrc),
      [
        "/ads/home-ad-tokyo.png",
        "/ads/home-ad-taiwan.png",
        "/ads/home-ad-osaka.png",
      ],
    );
    assert.equal(HOME_AD_INTERVAL_MS, 3_000);
    assert.equal(getNextHomeAdIndex(0, HOME_ADS.length), 1);
    assert.equal(getNextHomeAdIndex(2, HOME_ADS.length), 0);
  });
});
