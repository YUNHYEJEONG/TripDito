import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import type { ShoppingItem } from "../features/shopping-items/schema";
import type { Shot } from "../features/shots/schema";
import {
  buildItemRanking,
  mergeItemRankingSources,
  type ItemRankingPeriod,
} from "../features/shots/utils/item-ranking";
import {
  DITTO_RECOMMENDATION,
  ITEM_RANKING_CATALOG,
} from "../features/shots/data/item-ranking-catalog";
import type { Trip } from "../features/trips/schema";

const NOW = new Date("2026-08-13T12:00:00.000Z");

function trip(id: string, city: string, country = "일본"): Trip {
  return {
    id,
    name: `${city} 여행`,
    city,
    country,
    startDate: "2026-08-01",
    endDate: "2026-08-05",
    currency: "JPY",
    budget: 0,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  };
}

function item(
  id: string,
  tripId: string,
  name: string,
  createdAt: string,
): ShoppingItem {
  return {
    id,
    tripId,
    name,
    estimatedPrice: 1000,
    quantity: 1,
    memo: "",
    imageDataUrl: null,
    plannedPurchaseDate: null,
    plannedPurchaseDates: [],
    giftTags: [],
    purchased: false,
    purchasedAt: null,
    sortOrder: 0,
    createdAt,
    updatedAt: createdAt,
  };
}

function shot(
  id: string,
  tripId: string,
  shoppingItemIds: string[],
  createdAt: string,
): Shot {
  return {
    id,
    channel: "shots",
    tripId,
    authorId: "author",
    authorNickname: "여행자",
    authorAvatarDataUrl: null,
    destinationCountry: "일본",
    destinationCity: "도쿄",
    images: ["/image.jpg"],
    pins: [],
    body: "",
    shoppingItemIds,
    likeCount: 0,
    likedByMe: false,
    shareCount: 0,
    comments: [],
    createdAt,
    updatedAt: createdAt,
  };
}

function ranking(
  period: ItemRankingPeriod,
  options: Omit<Parameters<typeof buildItemRanking>[0], "period" | "now">,
) {
  return buildItemRanking({ ...options, period, now: NOW });
}

describe("item ranking", () => {
  const trips = [trip("tokyo-1", "도쿄"), trip("tokyo-2", "도쿄")];

  it("aggregates real local list saves and unique shot links by product", () => {
    const items = [
      item("a", "tokyo-1", "말차 초콜릿", "2026-08-13T10:00:00.000Z"),
      item("b", "tokyo-2", "  말차   초콜릿 ", "2026-08-13T09:00:00.000Z"),
    ];
    const shots = [
      shot(
        "s1",
        "tokyo-1",
        ["a", "a"],
        "2026-08-13T11:00:00.000Z",
      ),
    ];

    const result = ranking("realtime", { items, trips, shots });

    assert.equal(result.length, 1);
    assert.equal(result[0]?.listCount, 2);
    assert.equal(result[0]?.shotCount, 1);
    assert.equal(result[0]?.activityCount, 3);
  });

  it("uses exact period windows instead of inventing fallback rows", () => {
    const items = [
      item("recent", "tokyo-1", "최근 상품", "2026-08-12T10:00:00.000Z"),
      item("week", "tokyo-1", "주간 상품", "2026-08-08T10:00:00.000Z"),
      item("old", "tokyo-1", "오래된 상품", "2026-06-01T10:00:00.000Z"),
    ];

    assert.deepEqual(ranking("realtime", { items, trips, shots: [] }), []);
    assert.deepEqual(
      ranking("weekly", { items, trips, shots: [] }).map((row) => row.name),
      ["최근 상품", "주간 상품"],
    );
  });

  it("filters against the item's actual trip destination", () => {
    const osaka = trip("osaka", "오사카");
    const items = [
      item("tokyo", "tokyo-1", "도쿄 상품", "2026-08-13T10:00:00.000Z"),
      item("osaka", "osaka", "오사카 상품", "2026-08-13T10:00:00.000Z"),
    ];

    const result = buildItemRanking({
      items,
      trips: [...trips, osaka],
      shots: [],
      period: "realtime",
      destination: { city: "오사카", country: "일본" },
      now: NOW,
    });

    assert.deepEqual(result.map((row) => row.name), ["오사카 상품"]);
  });

  it("keeps the restored 20-item period catalogs read-only", () => {
    assert.equal(ITEM_RANKING_CATALOG.realtime.length, 20);
    assert.equal(ITEM_RANKING_CATALOG.weekly.length, 20);
    assert.equal(ITEM_RANKING_CATALOG.monthly.length, 20);
    assert.equal(ITEM_RANKING_CATALOG.realtime[0]?.rank, 1);
    assert.equal(DITTO_RECOMMENDATION.name, "트래블 미니 파우치 세트");
    assert.ok(Object.isFrozen(ITEM_RANKING_CATALOG));
    assert.ok(Object.isFrozen(ITEM_RANKING_CATALOG.realtime));
    assert.ok(Object.isFrozen(ITEM_RANKING_CATALOG.realtime[0]));
    for (const item of ITEM_RANKING_CATALOG.realtime) {
      assert.equal(
        existsSync(
          join(process.cwd(), "public", item.imageSrc.replace(/^\//, "")),
        ),
        true,
        `missing ranking image: ${item.imageSrc}`,
      );
    }
  });

  it("annotates matching catalog rows without replacing demo counts", () => {
    const account = ranking("realtime", {
      items: [
        item(
          "mine",
          "tokyo-1",
          "시세이도 화이트루센트 세럼",
          "2026-08-13T10:00:00.000Z",
        ),
        item(
          "only-mine",
          "tokyo-1",
          "내가 직접 찾은 상품",
          "2026-08-13T09:00:00.000Z",
        ),
      ],
      trips,
      shots: [],
    });
    const catalogSource = ITEM_RANKING_CATALOG.realtime.slice(0, 1);

    const merged = mergeItemRankingSources(account, catalogSource);

    assert.equal(merged.catalog[0]?.packCount, 1284);
    assert.equal(merged.catalog[0]?.accountActivityCount, 1);
    assert.deepEqual(
      merged.accountOnly.map((row) => row.name),
      ["내가 직접 찾은 상품"],
    );
    assert.equal(ITEM_RANKING_CATALOG.realtime[0]?.packCount, 1284);
  });
});
