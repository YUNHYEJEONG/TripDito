import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPassportPageIndexAfterLayoutChange,
  getPassportPageNavigation,
  getPassportPageRange,
  paginatePassportTrips,
  shouldShowPassportPageNavigation,
} from "../features/profile/utils/passport-pagination";

function ids(count: number) {
  return Array.from({ length: count }, (_, index) => `trip-${index + 1}`);
}

describe("passport pagination", () => {
  it("fills each complete physical page with up to four stamps", () => {
    const expected = new Map<number, number[]>([
      [0, [0]],
      [1, [1]],
      [3, [3]],
      [4, [4]],
      [5, [4, 1]],
      [8, [4, 4]],
      [9, [4, 4, 1]],
      [17, [4, 4, 4, 4, 1]],
    ]);

    for (const [count, distribution] of expected) {
      assert.deepEqual(
        paginatePassportTrips(ids(count)).map((page) => page.trips.length),
        distribution,
      );
    }
  });

  it("preserves source order and assigns physical page numbers", () => {
    const source = ids(13);
    const snapshot = [...source];
    const pages = paginatePassportTrips(source);

    assert.deepEqual(
      pages.flatMap((page) => page.trips),
      source,
    );
    assert.deepEqual(source, snapshot);
    assert.deepEqual(
      pages.map((page) => page.pageNumber),
      [1, 2, 3, 4],
    );
    assert.deepEqual(
      pages.map((page) => page.positionLabel),
      ["1 / 4", "2 / 4", "3 / 4", "4 / 4"],
    );
  });

  it("advances one physical page and clamps at either edge", () => {
    assert.deepEqual(getPassportPageNavigation(-1, 3), {
      index: 0,
      previousIndex: null,
      nextIndex: 1,
      canGoPrevious: false,
      canGoNext: true,
    });
    assert.deepEqual(getPassportPageNavigation(1, 3), {
      index: 1,
      previousIndex: 0,
      nextIndex: 2,
      canGoPrevious: true,
      canGoNext: true,
    });
    assert.deepEqual(getPassportPageNavigation(99, 3), {
      index: 2,
      previousIndex: 1,
      nextIndex: null,
      canGoPrevious: true,
      canGoNext: false,
    });
    assert.deepEqual(getPassportPageNavigation(3, 0), {
      index: 0,
      previousIndex: null,
      nextIndex: null,
      canGoPrevious: false,
      canGoNext: false,
    });
  });

  it("advances non-overlapping two-page Fold spreads and handles an odd end", () => {
    assert.deepEqual(getPassportPageNavigation(0, 5, 2), {
      index: 0,
      previousIndex: null,
      nextIndex: 2,
      canGoPrevious: false,
      canGoNext: true,
    });
    assert.deepEqual(getPassportPageNavigation(2, 5, 2), {
      index: 2,
      previousIndex: 0,
      nextIndex: 4,
      canGoPrevious: true,
      canGoNext: true,
    });
    assert.deepEqual(getPassportPageNavigation(99, 5, 2), {
      index: 4,
      previousIndex: 2,
      nextIndex: null,
      canGoPrevious: true,
      canGoNext: false,
    });
    assert.deepEqual(getPassportPageRange(0, 5, 2), {
      startPageNumber: 1,
      endPageNumber: 2,
      pageLabel: "1–2쪽",
      positionLabel: "1–2 / 5",
    });
    assert.deepEqual(getPassportPageRange(4, 5, 2), {
      startPageNumber: 5,
      endPageNumber: 5,
      pageLabel: "5쪽",
      positionLabel: "5 / 5",
    });
  });

  it("aligns a phone page to a Fold spread and keeps that left page on return", () => {
    const foldLeftIndex = getPassportPageIndexAfterLayoutChange(1, 5, true);
    assert.equal(foldLeftIndex, 0);
    assert.equal(
      getPassportPageIndexAfterLayoutChange(foldLeftIndex, 5, false),
      0,
    );

    assert.equal(getPassportPageIndexAfterLayoutChange(3, 5, true), 2);
    assert.equal(getPassportPageIndexAfterLayoutChange(99, 5, true), 4);
    assert.equal(getPassportPageIndexAfterLayoutChange(-3, 5, false), 0);
  });

  it("shows controls only when another phone page or Fold spread exists", () => {
    assert.equal(shouldShowPassportPageNavigation(1, 1), false);
    assert.equal(shouldShowPassportPageNavigation(2, 1), true);
    assert.equal(shouldShowPassportPageNavigation(2, 2), false);
    assert.equal(shouldShowPassportPageNavigation(3, 2), true);
  });
});
