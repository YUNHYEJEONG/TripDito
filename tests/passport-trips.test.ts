import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getCompletedPassportTrips,
  getServerPassportStampPages,
  getTodayKeyInKorea,
  isPassportCompletedTrip,
} from "../features/profile/utils/passport-trips";
import type { Trip } from "../features/trips/types";

function trip(id: string, startDate: string, endDate: string): Trip {
  return {
    id,
    name: id,
    city: id,
    country: "일본",
    startDate,
    endDate,
    currency: "JPY",
    budget: 0,
    createdAt: `${startDate}T00:00:00.000Z`,
    updatedAt: `${startDate}T00:00:00.000Z`,
  };
}

describe("passport completed trips", () => {
  it("uses the Korea calendar date independently of UTC", () => {
    assert.equal(
      getTodayKeyInKorea(new Date("2026-08-14T15:30:00.000Z")),
      "2026-08-15",
    );
  });

  it("includes only finished trips and sorts the newest stamp first", () => {
    const trips = [
      trip("old", "2026-01-01", "2026-01-05"),
      trip("today", "2026-08-10", "2026-08-14"),
      trip("newer", "2026-07-01", "2026-07-03"),
      trip("future", "2026-09-01", "2026-09-03"),
    ];

    assert.deepEqual(
      getCompletedPassportTrips(trips, "2026-08-14").map(({ id }) => id),
      ["newer", "old"],
    );
  });
});

describe("passport completed trips · 여행 마치기", () => {
  const today = "2026-09-05";

  it("treats a trip marked DONE as completed even before its end date", () => {
    const future = { ...trip("early", "2026-09-01", "2026-09-20"), status: "DONE" as const };
    assert.equal(isPassportCompletedTrip(future, today), true);
    assert.deepEqual(
      getCompletedPassportTrips([future, trip("later", "2026-10-01", "2026-10-03")], today).map((t) => t.id),
      ["early"],
    );
  });

  it("still completes a trip whose end date has passed without a status", () => {
    assert.equal(isPassportCompletedTrip(trip("past", "2026-08-01", "2026-08-03"), today), true);
    assert.equal(isPassportCompletedTrip(trip("ongoing", "2026-09-04", "2026-09-06"), today), false);
  });

  it("collects server-saved stamp pages and ignores unstamped trips", () => {
    const stamped = { ...trip("a", "2026-08-01", "2026-08-03"), passportPage: 2 };
    const unstamped = { ...trip("b", "2026-08-01", "2026-08-03"), passportPage: null };
    assert.deepEqual(getServerPassportStampPages([stamped, unstamped, trip("c", "2026-08-01", "2026-08-03")]), { a: 2 });
  });
});
