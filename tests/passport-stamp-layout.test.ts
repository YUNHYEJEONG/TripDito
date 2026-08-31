import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PASSPORT_STAMP_CELL,
  PASSPORT_STAMP_CELL_GUTTER,
  getPassportStampPlacements,
  isPassportStampCellWithinPage,
  passportStampCellsOverlap,
} from "../features/profile/utils/passport-stamp-layout";
import { PASSPORT_TRIPS_PER_PAGE } from "../features/profile/utils/passport-pagination";

const destinations = [
  ["대만", "타이베이"],
  ["일본", "교토"],
  ["대한민국", "서울"],
  ["프랑스", "파리"],
  ["태국", "방콕"],
  ["이탈리아", "로마"],
  ["중국", "상하이"],
  ["미국", "뉴욕"],
  ["베트남", "다낭"],
  ["호주", "시드니"],
  ["싱가포르", "싱가포르"],
  ["영국", "런던"],
  ["스페인", "바르셀로나"],
  ["아이슬란드", "레이캬비크"],
] as const;

function trip(index: number) {
  const [country, city] = destinations[index % destinations.length];
  const day = String((index % 27) + 1).padStart(2, "0");

  return {
    id: `passport-layout-trip-${index}`,
    country,
    city,
    endDate: `2026-07-${day}`,
  };
}

function page(startIndex: number, count = PASSPORT_TRIPS_PER_PAGE) {
  return Array.from({ length: count }, (_, offset) => trip(startIndex + offset));
}

/** 실제 기기에서 나오는 내지 크기(px). 세로비가 기기마다 크게 다르다. */
const PAGE_SIZES = [
  { label: "320x568", width: 270, height: 295 },
  { label: "360x640", width: 294, height: 367 },
  { label: "390x844 standalone", width: 324, height: 478 },
  { label: "412x915", width: 346, height: 594 },
  { label: "700px 폴더블 한 면", width: 286, height: 627 },
];

/** 계단에서 두 단 이상 떨어진 짝. 이 짝만 겹치면 안 된다. */
function isDistantPair(first: number, second: number) {
  return Math.abs(first - second) >= 2;
}

/** 칸의 **중심**으로 좌우를 가른다 — 칸이 종이 절반보다 넓어서 left만으로는 못 가른다. */
function isLeftSide(cell: { left: number; width: number }) {
  return cell.left + cell.width / 2 < 50;
}

/** CSS `min(100cqw / widthFactor, 100cqh / heightFactor)`와 같은 계산. */
function inkSize(
  placement: ReturnType<typeof getPassportStampPlacements>[number],
  pageWidth: number,
  pageHeight: number,
) {
  const cellWidth = (pageWidth * placement.cell.width) / 100;
  const cellHeight = (pageHeight * placement.cell.height) / 100;
  const width = Math.min(
    cellWidth / placement.widthFactor,
    cellHeight / placement.heightFactor,
  );

  return { width, height: width / placement.aspectRatio, cellWidth, cellHeight };
}

describe("passport stamp cell layout", () => {
  it("is deterministic for the same physical page and persisted trips", () => {
    const trips = page(0);

    assert.deepEqual(
      getPassportStampPlacements(trips, { pageNumber: 3 }),
      getPassportStampPlacements(
        trips.map((item) => ({ ...item })),
        { pageNumber: 3 },
      ),
    );
  });

  it("keeps every step inside the page and never stacks distant steps", () => {
    for (let index = 0; index < 60; index += 1) {
      const placements = getPassportStampPlacements(page(index), {
        pageNumber: index + 1,
      });

      assert.equal(placements.length, PASSPORT_TRIPS_PER_PAGE);
      for (const [order, placement] of placements.entries()) {
        assert.equal(
          isPassportStampCellWithinPage(placement.cell),
          true,
          `${placement.tripId} escaped the page in ${placement.pattern}`,
        );
        for (const [otherOrder, other] of placements.entries()) {
          if (otherOrder <= order || !isDistantPair(order, otherOrder)) continue;
          assert.equal(
            passportStampCellsOverlap(placement.cell, other.cell),
            false,
            `${placement.pattern}: ${placement.tripId} stacked on ${other.tripId}`,
          );
        }
      }
    }
  });

  it("runs the four steps down the whole height of the page", () => {
    const [first, , , last] = getPassportStampPlacements(page(0), {
      pageNumber: 1,
    });

    assert.equal(first.cell.top, 0);
    assert.equal(last.cell.top + last.cell.height, 100);
    // 좌우를 번갈아 밟아야 계단으로 보인다.
    for (let index = 0; index < 20; index += 1) {
      const placements = getPassportStampPlacements(page(index), {
        pageNumber: index + 1,
      });

      for (const [order, placement] of placements.entries()) {
        if (order === 0) continue;
        const previous = placements[order - 1];
        assert.notEqual(
          isLeftSide(placement.cell),
          isLeftSide(previous.cell),
          `${placement.pattern}: step ${order} stayed on the same side`,
        );
        assert.ok(placement.cell.top > previous.cell.top);
      }
    }
  });

  it("keeps the rotated artwork inside its cell on every page size", () => {
    for (const size of PAGE_SIZES) {
      for (let index = 0; index < 20; index += 1) {
        const placements = getPassportStampPlacements(page(index), {
          pageNumber: index + 1,
        });

        for (const placement of placements) {
          const ink = inkSize(placement, size.width, size.height);
          const radians = (Math.abs(placement.rotation) * Math.PI) / 180;
          const rotatedWidth =
            ink.width * Math.cos(radians) + ink.height * Math.sin(radians);
          const rotatedHeight =
            ink.width * Math.sin(radians) + ink.height * Math.cos(radians);

          assert.ok(
            rotatedWidth <= ink.cellWidth + 0.001 &&
              rotatedHeight <= ink.cellHeight + 0.001,
            `${size.label} ${placement.tripId} overflowed its cell`,
          );
          assert.ok(
            ink.width >= 44 && ink.height >= 44,
            `${size.label} ${placement.tripId} fell under the 44px touch target`,
          );
        }
      }
    }
  });

  it("beats the square grid it replaced on a tall page", () => {
    // 계단은 좌우 두 열이 겹쳐야 도장이 커진다 — 반씩 나눠 쓰면 예전 격자와 같아진다.
    assert.ok(
      PASSPORT_STAMP_CELL.width > 50 + PASSPORT_STAMP_CELL_GUTTER,
      "columns no longer overlap, so stamps cannot grow",
    );
    // 네 단이 종이 세로를 처음부터 끝까지 쓴다.
    const pitch = (100 - PASSPORT_STAMP_CELL.height) / 3;
    assert.ok(2 * pitch >= PASSPORT_STAMP_CELL.height, "distant steps collide");

    // 세로로 긴 내지에서 정사각 도장이 실제로 얼마나 커지는지 잰다.
    const page412 = { width: 346, height: 594 };
    const [placement] = getPassportStampPlacements(page(0), { pageNumber: 1 });
    const grown = Math.min(
      (page412.width * PASSPORT_STAMP_CELL.width) / 100,
      (page412.height * PASSPORT_STAMP_CELL.height) / 100,
    );
    const square = Math.min(page412.width, page412.height) * 0.46;

    assert.ok(
      grown > square * 1.15,
      `stamp only grew from ${square.toFixed(0)}px to ${grown.toFixed(0)}px`,
    );
    assert.ok(placement.widthFactor > 1 && placement.heightFactor > 1);
  });

  it("uses several loose compositions instead of one mechanical grid", () => {
    const patterns = new Set<string>();
    const signatures = new Set<string>();

    for (let index = 0; index < 40; index += 1) {
      const placements = getPassportStampPlacements(page(index), {
        pageNumber: index + 1,
      });
      patterns.add(placements[0].pattern);
      signatures.add(
        placements
          .map(
            ({ cell, rotationOffset }) =>
              `${cell.left},${cell.top},${rotationOffset}`,
          )
          .join("|"),
      );
    }

    assert.ok(patterns.size >= 4, `only ${patterns.size} compositions appeared`);
    assert.ok(signatures.size >= 8, `only ${signatures.size} layouts appeared`);
  });

  it("starts a partly stamped page at the top and alternates which side", () => {
    const sides = new Set<boolean>();

    for (let index = 0; index < 20; index += 1) {
      const [placement] = getPassportStampPlacements(page(index, 1), {
        pageNumber: index + 1,
      });

      // 실제 여권도 위부터 채운다 — 한 장 안에서 채우는 순서가 곧 보이는 순서다.
      assert.equal(placement.cell.top, 0);
      assert.equal(isPassportStampCellWithinPage(placement.cell), true);
      sides.add(isLeftSide(placement.cell));
    }

    assert.equal(sides.size, 2, "a lone stamp always landed on the same side");
  });
});
