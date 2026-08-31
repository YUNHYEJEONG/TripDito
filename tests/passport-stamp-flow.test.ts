import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assignPassportStampPage,
  getPassportStampFlow,
  paginatePassportTripsWithAssignments,
  sanitizePassportStampPageAssignments,
} from "../features/profile/utils/passport-stamp-flow";

type TestTrip = { id: string; label: string };

function trips(...ids: string[]): TestTrip[] {
  return ids.map((id) => ({ id, label: id.toUpperCase() }));
}

function pageIds(source: readonly { trips: TestTrip[] }[]) {
  return source.map((page) => page.trips.map((trip) => trip.id));
}

describe("passport stamp page assignments", () => {
  it("keeps only bounded integer pages for safe trip ids", () => {
    assert.deepEqual(
      sanitizePassportStampPageAssignments({
        taipei: 1,
        paris: 100,
        zero: 0,
        negative: -1,
        decimal: 1.5,
        huge: 101,
        text: "2",
        ["x".repeat(201)]: 2,
        "bad\ntrip": 2,
      }),
      { taipei: 1, paris: 100 },
    );
    assert.deepEqual(sanitizePassportStampPageAssignments(null), {});
    assert.deepEqual(sanitizePassportStampPageAssignments([]), {});
  });

  it("updates one valid assignment without mutating the source", () => {
    const source = { taipei: 1 };
    const next = assignPassportStampPage(source, "paris", 2);

    assert.deepEqual(source, { taipei: 1 });
    assert.deepEqual(next, { taipei: 1, paris: 2 });
    assert.deepEqual(assignPassportStampPage(source, "paris", 0), source);
  });

  it("keeps chosen pages, fills open spaces, and never exceeds four stamps", () => {
    const source = trips("a", "b", "c", "d", "e");
    const snapshot = structuredClone(source);
    const pages = paginatePassportTripsWithAssignments(source, { a: 3 });

    assert.deepEqual(pageIds(pages), [["b", "c", "d", "e"], [], ["a"]]);
    assert.ok(pages.every((page) => page.trips.length <= 4));
    assert.deepEqual(source, snapshot);
  });

  it("deduplicates input and safely resolves conflicting or corrupt metadata", () => {
    const [a, b, c] = trips("a", "b", "c");
    const pages = paginatePassportTripsWithAssignments([a, a, b, c], {
      a: 2,
      b: 2,
      c: 2,
      ghost: 100,
    });

    assert.deepEqual(pageIds(pages), [[], ["a", "b", "c"]]);
    assert.deepEqual(
      pages.flatMap((page) => page.trips.map((trip) => trip.id)).sort(),
      ["a", "b", "c"],
    );

    assert.deepEqual(
      pageIds(paginatePassportTripsWithAssignments(trips("a", "b"), { a: 100 })),
      [["a", "b"]],
    );
  });
});

describe("passport stamp intent flow", () => {
  it("keeps ordinary passport browsing unchanged without an intent", () => {
    const flow = getPassportStampFlow(trips("a", "b", "c"), {}, null);

    assert.equal(flow.state, "browse");
    assert.deepEqual(pageIds(flow.pages), [["a", "b", "c"]]);
    assert.deepEqual(flow.selectablePageIndices, []);
  });

  it("rejects a target that is not in the completed-trip source", () => {
    const flow = getPassportStampFlow(trips("completed"), {}, "planned");

    assert.equal(flow.state, "invalid-target");
    assert.equal(flow.target, null);
    assert.deepEqual(pageIds(flow.pages), [["completed"]]);
  });

  it("hides an unstamped target until an available physical page is selected", () => {
    const flow = getPassportStampFlow(trips("a", "b"), {}, "b");

    assert.equal(flow.state, "select-page");
    assert.equal(flow.target?.id, "b");
    assert.deepEqual(pageIds(flow.pages), [["a"], []]);
    assert.deepEqual(flow.selectablePageIndices, [0, 1]);
    assert.equal(
      flow.pages.some((page) => page.trips.some((trip) => trip.id === "b")),
      false,
    );
  });

  it("opens a persisted stamp on its real page without inserting a duplicate", () => {
    const flow = getPassportStampFlow(trips("a", "b"), { b: 2 }, "b");
    const stampedCopies = flow.pages
      .flatMap((page) => page.trips)
      .filter((trip) => trip.id === "b");

    assert.equal(flow.state, "already-stamped");
    assert.equal(flow.initialPageIndex, 1);
    assert.equal(flow.stampedPageIndex, 1);
    assert.equal(stampedCopies.length, 1);
    assert.deepEqual(flow.selectablePageIndices, []);
  });
});
