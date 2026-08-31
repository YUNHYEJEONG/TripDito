import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PASSPORT_STAMP_KNOWN_FAMILIES,
  getPassportStampCode,
  getPassportStampDesign,
  getPassportStampTextureSeed,
  getPassportTripHref,
} from "../features/profile/utils/passport-stamp";
import {
  PASSPORT_STAMP_PROPORTIONS,
  PASSPORT_STAMP_ARTWORK_FAMILIES,
  getPassportStampGenericMotifVariant,
  getPassportStampArtworkGeometry,
  hasPassportStampArtwork,
} from "../features/profile/components/passport-stamp-artwork";

describe("passport stamp design", () => {
  it("keeps every stamp shape recognisable as a proportion, not a pixel size", () => {
    const expected = {
      wide: 130 / 92,
      round: 1,
      oval: 132 / 92,
      square: 1,
      tall: 85 / 113,
      polygon: 118 / 109,
    } as const;

    for (const [geometry, ratio] of Object.entries(expected)) {
      assert.equal(
        PASSPORT_STAMP_PROPORTIONS[
          geometry as keyof typeof PASSPORT_STAMP_PROPORTIONS
        ],
        ratio,
      );
    }

    // 세로형과 가로형이 분명히 갈려야 도장이 한 종류로 보이지 않는다.
    assert.ok(PASSPORT_STAMP_PROPORTIONS.tall < 0.8);
    assert.ok(PASSPORT_STAMP_PROPORTIONS.oval > 1.4);
  });

  it("keeps the Taiwan and France country-specific stamp identities", () => {
    const taiwan = getPassportStampDesign({ country: "대만", city: "타이베이" });
    const france = getPassportStampDesign({ country: "프랑스", city: "파리" });

    assert.deepEqual(
      { family: taiwan.family, shape: taiwan.shape, ink: taiwan.ink },
      { family: "taiwan", shape: "round", ink: "#9d3f36" },
    );
    assert.deepEqual(
      { family: france.family, shape: france.shape, ink: france.ink },
      { family: "france", shape: "rectangle", ink: "#565184" },
    );
  });

  it("gives fallback destination countries stable parametric themes", () => {
    const destinations = [
      ["홍콩", "홍콩"],
      ["필리핀", "세부"],
      ["인도네시아", "발리"],
      ["말레이시아", "쿠알라룸푸르"],
      ["캐나다", "밴쿠버"],
      ["독일", "베를린"],
      ["네덜란드", "암스테르담"],
      ["뉴질랜드", "오클랜드"],
    ] as const;
    const themes = destinations.map(([country, city]) => {
      const design = getPassportStampDesign({ country, city });
      return `${design.shape}|${design.ink}|${getPassportStampGenericMotifVariant(design.family)}`;
    });

    assert.ok(new Set(themes).size >= 4);
    const iceland = getPassportStampDesign({
      country: "아이슬란드",
      city: "레이캬비크",
    });
    assert.equal(
      getPassportStampGenericMotifVariant(iceland.family),
      getPassportStampGenericMotifVariant(iceland.family),
    );
  });

  it("provides genuinely different artwork families for key destinations", () => {
    const destinations = [
      ["일본", "교토", "japan", "rectangle"],
      ["대만", "타이베이", "taiwan", "round"],
      ["프랑스", "파리", "france", "rectangle"],
      ["대한민국", "서울", "korea", "round"],
      ["태국", "방콕", "thailand", "oval"],
      ["이탈리아", "로마", "italy", "polygon"],
      ["중국", "상하이", "china", "square"],
      ["미국", "뉴욕", "united-states", "oval"],
      ["베트남", "다낭", "vietnam", "rectangle"],
      ["호주", "시드니", "australia", "round"],
      ["싱가포르", "싱가포르", "singapore", "rectangle"],
      ["영국", "런던", "united-kingdom", "rectangle"],
      ["스페인", "바르셀로나", "spain", "oval"],
    ] as const;

    for (const [country, city, family, shape] of destinations) {
      const design = getPassportStampDesign({ country, city });
      assert.equal(design.family, family);
      assert.equal(design.shape, shape);
      assert.ok(design.countryCode);
    }
  });

  it("has a non-generic renderer and geometry for every known country family", () => {
    assert.deepEqual(
      new Set(PASSPORT_STAMP_ARTWORK_FAMILIES),
      new Set(PASSPORT_STAMP_KNOWN_FAMILIES),
    );

    for (const family of PASSPORT_STAMP_KNOWN_FAMILIES) {
      assert.equal(hasPassportStampArtwork(family), true, family);
      assert.notEqual(getPassportStampArtworkGeometry(family), null, family);
    }

    assert.equal(hasPassportStampArtwork("custom-example"), false);
    assert.equal(getPassportStampArtworkGeometry("custom-example"), null);
  });

  it("generates deterministic hydration-safe texture seeds and memory codes", () => {
    const trip = {
      id: "demo-trip-kyoto",
      country: "일본",
      city: "교토",
      endDate: "2026-04-09",
    };

    assert.equal(
      getPassportStampTextureSeed(trip),
      getPassportStampTextureSeed({ ...trip }),
    );
    assert.equal(getPassportStampCode(trip), getPassportStampCode({ ...trip }));
    assert.match(getPassportStampCode(trip), /^NO\.\d{4}$/);
    assert.notEqual(
      getPassportStampTextureSeed(trip),
      getPassportStampTextureSeed({ ...trip, id: "another-trip" }),
    );
  });

  it("uses country identity instead of list order or city", () => {
    const aliases = [
      getPassportStampDesign({ country: "대만", city: "타이베이" }),
      getPassportStampDesign({ country: "타이완", city: "가오슝" }),
      getPassportStampDesign({ country: "Taiwan", city: "Taichung" }),
    ];

    for (const design of aliases) {
      assert.equal(design.family, "taiwan");
      assert.equal(design.shape, "round");
    }

    const customBefore = getPassportStampDesign({
      country: "아이슬란드",
      city: "레이캬비크",
    });
    const customAfter = getPassportStampDesign({
      country: "아이슬란드",
      city: "아쿠레이리",
    });
    assert.deepEqual(customAfter, customBefore);
  });

  it("returns a safely encoded trip link back to the passport", () => {
    assert.equal(
      getPassportTripHref("demo-v1-trip-taipei"),
      "/trips/demo-v1-trip-taipei?returnTo=%2Fpassport%3Fview%3Dstamps",
    );
    assert.equal(
      getPassportTripHref("trip/1"),
      "/trips/trip%2F1?returnTo=%2Fpassport%3Fview%3Dstamps",
    );

    const returnTo =
      "/passport?view=stamps&stampTripId=trip%2F1&stampPage=3&returnTo=%2Ftrips%2Fsource";
    const special = new URL(
      getPassportTripHref("trip/한", returnTo),
      "https://tripdito.local",
    );
    assert.equal(special.pathname, "/trips/trip%2F%ED%95%9C");
    assert.equal(special.searchParams.get("returnTo"), returnTo);
  });
});
