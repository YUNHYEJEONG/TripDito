import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getHomeTripDockViewModel,
  HOME_NEW_TRIP_HREF,
} from "../features/home/utils/home-trip-dock";
import type { Trip } from "../features/trips/types";

const trip: Trip = {
  id: "osaka",
  name: "오사카 맛집과 쇼핑",
  country: "일본",
  city: "오사카",
  startDate: "2026-08-20",
  endDate: "2026-08-23",
  currency: "JPY",
  budget: 80_000,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const metrics = {
  itemCount: 6,
  purchasedCount: 3,
};

describe("home trip dock", () => {
  it("keeps one dock system while giving every state a distinct semantic marker", () => {
    const views = [
      getHomeTripDockViewModel(null, "idle", "2026-08-14"),
      ...(["idle", "prep", "live", "after"] as const).map((mode) =>
        getHomeTripDockViewModel(trip, mode, "2026-08-21", metrics),
      ),
    ];

    assert.deepEqual(
      views.map(({ state }) => state),
      ["none", "idle", "prep", "live", "after"],
    );
    assert.equal(new Set(views.map(({ iconKey }) => iconKey)).size, views.length);
    assert.deepEqual(
      views.map(({ statusLabel }) => statusLabel),
      ["여행 없음", "준비 전", "여행 계획", "여행 중", "결산"],
    );
  });

  it("uses the same metric hierarchy in every populated state", () => {
    const views = (["idle", "prep", "live", "after"] as const).map((mode) =>
      getHomeTripDockViewModel(trip, mode, "2026-08-21", metrics),
    );

    assert.deepEqual(
      views.map(({ metricValue }) => metricValue),
      ["8.20", "D-Day", "2일차", "3개"],
    );
    assert.deepEqual(
      views.map(({ metricCaption }) => metricCaption),
      ["출발일", "출발까지", "8.23까지", "구매 기록"],
    );
  });

  it("uses actual local shopping counts for live and settlement context", () => {
    const live = getHomeTripDockViewModel(
      trip,
      "live",
      "2026-08-21",
      metrics,
    );
    const after = getHomeTripDockViewModel(
      trip,
      "after",
      "2026-08-30",
      metrics,
    );

    assert.equal(live.metricCaption, "8.23까지");
    assert.equal(after.metricValue, "3개");
    assert.equal(after.metricCaption, "구매 기록");
  });

  it("does not invent airport, flight, gate, or seat data", () => {
    const view = getHomeTripDockViewModel(
      { ...trip, city: "후쿠오카" },
      "prep",
      "2026-08-15",
      metrics,
    );

    assert.equal(view.cityLabel, "후쿠오카");
    assert.equal("originCode" in view, false);
    assert.equal("destinationCode" in view, false);
  });

  it("keeps new-trip creation separate and returns to Home", () => {
    assert.equal(HOME_NEW_TRIP_HREF, "/trips/new?returnTo=/home");
  });

  it("shows D-day before travel and the current day while traveling", () => {
    assert.equal(
      getHomeTripDockViewModel(trip, "prep", "2026-08-14", metrics).dayLabel,
      "D-6",
    );
    assert.equal(
      getHomeTripDockViewModel(trip, "live", "2026-08-21", metrics).dayLabel,
      "2일차",
    );
    assert.equal(
      getHomeTripDockViewModel(trip, "after", "2026-08-30", metrics).dayLabel,
      "3개",
    );
  });

  it("adds a short year only when the trip starts in another year", () => {
    assert.equal(
      getHomeTripDockViewModel(
        { ...trip, startDate: "2026-08-20" },
        "idle",
        "2026-08-14",
      ).metricValue,
      "8.20",
    );
    assert.equal(
      getHomeTripDockViewModel(
        { ...trip, startDate: "2027-08-20", endDate: "2027-08-23" },
        "idle",
        "2026-08-14",
      ).metricValue,
      "27.8.20",
    );
  });
});
