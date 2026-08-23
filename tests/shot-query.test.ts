import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Shot } from "../features/shots/types";
import {
  getHotDestinations,
  queryShots,
  searchDestinations,
} from "../features/shots/utils/shot-query";

function shot(
  partial: Partial<Shot> & Pick<Shot, "id" | "destinationCity" | "createdAt">,
): Shot {
  return {
    channel: "shots",
    tripId: "t1",
    authorId: "a1",
    authorNickname: "테스터",
    authorAvatarDataUrl: null,
    destinationCountry: "일본",
    images: ["data:image/svg+xml,x"],
    pins: [],
    body: "",
    shoppingItemIds: [],
    likeCount: 0,
    likedByMe: false,
    comments: [],
    shareCount: 0,
    updatedAt: partial.createdAt,
    ...partial,
  };
}

/** 최근 30일 집계 테스트가 날짜에 묶이지 않도록 "n일 전" ISO 문자열 생성 */
function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe("shot-query", () => {
  const shots = [
    shot({
      id: "1",
      destinationCity: "오사카",
      likeCount: 10,
      createdAt: daysAgo(3),
    }),
    shot({
      id: "2",
      destinationCity: "도쿄",
      likeCount: 50,
      createdAt: daysAgo(13),
    }),
    shot({
      id: "3",
      destinationCity: "오사카",
      likeCount: 5,
      createdAt: daysAgo(1),
    }),
  ];

  it("filters by destination and sorts by likes", () => {
    const filtered = queryShots(shots, {
      destination: { city: "오사카", country: "일본" },
      sort: "likes",
    });
    assert.deepEqual(
      filtered.map((row) => row.id),
      ["1", "3"],
    );
  });

  it("returns hot destinations by recent upload count", () => {
    const hot = getHotDestinations(shots, 5);
    assert.equal(hot[0]?.city, "오사카");
    assert.equal(hot[0]?.count, 2);
  });

  it("searches destinations", () => {
    const results = searchDestinations(
      [
        { city: "오사카", country: "일본" },
        { city: "파리", country: "프랑스" },
      ],
      "오사",
    );
    assert.equal(results.length, 1);
    assert.equal(results[0]?.city, "오사카");
  });
});
