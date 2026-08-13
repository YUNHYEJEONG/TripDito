import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { imageDraftBuilder } from "../features/image-analysis/mock-analyzer";
import { analysisJobRepository } from "../features/image-analysis/data/analysis-job-repository";
import { estimateToKrw } from "../features/coupang-compare/lib/serp-coupang";
import { notificationRepository } from "../features/notifications/data/notification-repository";
import { shotRepository } from "../features/shots/data/shot-repository";
import { storageKeys } from "../lib/storage/keys";
import {
  markFxSynced,
  shouldForceFxRefresh,
} from "../features/fx/lib/fx-schedule";

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

function withMemoryWindow(run: (storage: MemoryStorage) => void) {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const storage = new MemoryStorage();
  const windowMock = new EventTarget() as EventTarget & {
    localStorage: MemoryStorage;
  };
  windowMock.localStorage = storage;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: windowMock,
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

describe("honest image draft fallback", () => {
  it("uses only the filename and carries no inferred metadata", async () => {
    const [draft] = await imageDraftBuilder.analyze(
      [
        {
          id: "image-1",
          fileName: "돈키호테-영수증.png",
          dataUrl: "data:image/png;base64,demo",
        },
      ],
      { city: "도쿄", country: "일본", currency: "JPY" },
    );

    assert.equal(draft?.name, "돈키호테-영수증");
    assert.equal(draft?.estimatedPrice, 0);
    assert.equal(draft?.localName, "");
    assert.deepEqual(draft?.expectedStores, []);
    assert.equal(draft?.similarMatchCount, 0);
    assert.match(draft?.memo ?? "", /파일명/);
  });
});

describe("background image-analysis job compatibility", () => {
  it("normalizes an operating-version job without losing its result", () => {
    withMemoryWindow((storage) => {
      storage.setItem(
        storageKeys.analysisJob,
        JSON.stringify({
          id: "legacy-job",
          status: "done",
          tripId: "trip-1",
          images: [],
          context: { city: "도쿄", country: "일본", currency: "JPY" },
          provider: "catalog",
          proposed: [
            {
              name: "레거시 상품",
              estimatedPrice: 100,
              quantity: 1,
              memo: "",
              sourceImageId: "image-1",
              imageDataUrl: null,
            },
          ],
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      );

      const job = analysisJobRepository.get();
      assert.equal(job?.provider, "catalog-demo");
      assert.equal(job?.mode, "catalog-demo");
      assert.equal(job?.proposed[0]?.localName, "");
      assert.deepEqual(job?.proposed[0]?.expectedStores, []);
    });
  });

  it("keeps the purchase intent while analysis continues in the background", () => {
    withMemoryWindow(() => {
      analysisJobRepository.start({
        tripId: "trip-live",
        images: [
          {
            id: "receipt",
            fileName: "receipt.jpg",
            dataUrl: "data:image/jpeg;base64,demo",
          },
        ],
        context: { city: "도쿄", country: "일본", currency: "JPY" },
        intent: { kind: "trip-purchases", purchasedOn: "2026-08-13" },
      });

      assert.deepEqual(analysisJobRepository.get()?.intent, {
        kind: "trip-purchases",
        purchasedOn: "2026-08-13",
      });
    });
  });

  it("releases a completed image payload for item save and can restore it", () => {
    withMemoryWindow(() => {
      const job = analysisJobRepository.start({
        tripId: "trip-save",
        images: [
          {
            id: "large-image",
            fileName: "product.jpg",
            dataUrl: "data:image/jpeg;base64,large-payload",
          },
        ],
        context: { city: "도쿄", country: "일본", currency: "JPY" },
      });
      analysisJobRepository.markDone(
        job.id,
        [
          {
            name: "상품",
            estimatedPrice: 100,
            quantity: 1,
            memo: "",
            sourceImageId: "large-image",
            imageDataUrl: "data:image/jpeg;base64,large-payload",
            localName: "",
            expectedStores: [],
            similarMatchCount: 0,
          },
        ],
        { provider: "filename-draft", mode: "draft" },
      );

      const released = analysisJobRepository.releaseCompleted(job.id);
      assert.equal(analysisJobRepository.get(), null);
      assert.equal(released?.id, job.id);
      if (!released) assert.fail("completed job must be released");
      analysisJobRepository.restoreReleased(released);
      assert.equal(analysisJobRepository.get()?.id, job.id);
    });
  });
});

describe("Coupang comparison conversion", () => {
  it("keeps KRW exact and refuses invalid currency codes", async () => {
    assert.equal(await estimateToKrw(12_345.4, "krw"), 12_345);
    await assert.rejects(() => estimateToKrw(100, "원"), /INVALID_CURRENCY/);
  });
});

describe("FX publication refresh", () => {
  it("keeps retrying after 11 KST while the provider still returns yesterday", () => {
    withMemoryWindow(() => {
      const afterPublish = new Date("2026-08-13T03:00:00.000Z");
      markFxSynced("JPY", "2026-08-12", afterPublish);
      assert.equal(shouldForceFxRefresh("JPY", afterPublish), true);

      markFxSynced("JPY", "2026-08-13", afterPublish);
      assert.equal(shouldForceFxRefresh("JPY", afterPublish), false);
    });
  });
});

describe("notification inbox", () => {
  it("deduplicates, sorts, and persists read state on the legacy key", () => {
    withMemoryWindow((storage) => {
      const first = notificationRepository.create({
        type: "analysis-done",
        title: "사진 분석 완료",
        href: "/trips/t1",
        dedupeKey: "analysis:t1",
      });
      const duplicate = notificationRepository.create({
        type: "analysis-done",
        title: "중복",
        href: "/trips/t1",
        dedupeKey: "analysis:t1",
      });

      assert.ok(first);
      assert.equal(duplicate, null);
      assert.equal(notificationRepository.unreadCount(), 1);
      notificationRepository.markRead(first.id);
      assert.equal(notificationRepository.unreadCount(), 0);
      assert.ok(storage.getItem(storageKeys.notifications));
    });
  });

  it("ignores malformed legacy records instead of crashing the inbox", () => {
    withMemoryWindow((storage) => {
      storage.setItem(
        storageKeys.notifications,
        JSON.stringify([{ title: "broken" }, null, "invalid"]),
      );
      assert.deepEqual(notificationRepository.list(), []);
    });
  });
});

describe("operating shot compatibility", () => {
  it("keeps legacy shots and their connected shopping item in the feed", () => {
    withMemoryWindow((storage) => {
      const timestamp = "2026-01-01T00:00:00.000Z";
      storage.setItem(
        storageKeys.items,
        JSON.stringify([
          {
            id: "item-legacy",
            tripId: "trip-legacy",
            name: "레거시 상품",
            estimatedPrice: 100,
            quantity: 1,
            memo: "",
            imageDataUrl: null,
            plannedPurchaseDate: null,
            giftTags: [],
            purchased: false,
            purchasedAt: null,
            sortOrder: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ]),
      );
      storage.setItem(
        storageKeys.shots,
        JSON.stringify([
          {
            id: "shot-legacy",
            tripId: "trip-legacy",
            authorId: "author",
            authorNickname: "여행자",
            authorAvatarDataUrl: null,
            destinationCountry: "일본",
            destinationCity: "도쿄",
            images: ["/demo/shots/haul-1.png"],
            body: "운영판 때샷",
            shoppingItemIds: ["item-legacy"],
            likeCount: 1,
            likedByMe: false,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ]),
      );

      const [shot] = shotRepository.list();
      assert.equal(shot?.channel, "shots");
      assert.deepEqual(shot?.shoppingItemIds, ["item-legacy"]);
    });
  });
});
