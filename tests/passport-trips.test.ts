import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getCompletedPassportTrips,
  getTodayKeyInKorea,
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
