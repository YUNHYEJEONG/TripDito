import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getLivePurchaseProgressHref } from "../features/home/components/home-status-hero";
import { getHomeTripCardAction } from "../features/home/components/home-upcoming-trip-card";
import { getTripStatusLabel } from "../features/home/components/trip-switch-sheet";
import type { Trip } from "../features/trips/types";

function trip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "taipei-trip",
    name: "타이베이 여행",
    country: "대만",
    city: "타이베이",
    startDate: "2026-08-12",
    endDate: "2026-08-15",
    currency: "TWD",
    budget: 100_000,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("home action semantics", () => {
  it("uses the live destination image card for nearby map discovery", () => {
    const action = getHomeTripCardAction(trip(), "2026-08-13");
    const href = new URL(action.href, "https://tripdito.local");

    assert.equal(href.pathname, "/map");
    assert.equal(href.searchParams.get("q"), "타이베이");
    assert.equal(href.searchParams.get("returnTo"), "/home");
    assert.equal(action.label, "현지 지도와 쇼핑 장소 보기");
    assert.equal(action.ariaLabel, "타이베이 현지 지도와 쇼핑 장소 보기");
  });

  it("keeps upcoming and completed cards focused on plans and records", () => {
    const upcoming = getHomeTripCardAction(trip(), "2026-08-01");
    const completed = getHomeTripCardAction(trip(), "2026-08-20");

    assert.equal(
      upcoming.href,
      "/trips/taipei-trip?returnTo=%2Fhome",
    );
    assert.equal(upcoming.label, "다가오는 여행 계획 보기");
    assert.equal(upcoming.ariaLabel, "타이베이 여행 계획 보기");
    assert.equal(completed.href, "/trips/taipei-trip?returnTo=%2Fhome");
    assert.equal(completed.label, "지난 여행 기록 보기");
    assert.equal(completed.ariaLabel, "타이베이 여행 기록 보기");
  });

  it("routes the live inline action to purchase progress with a safe return", () => {
    assert.equal(
      getLivePurchaseProgressHref("live trip/1"),
      "/trips/live%20trip%2F1?returnTo=%2Fhome",
    );
  });

  it("uses natural, consistent labels for every trip status badge", () => {
    assert.equal(getTripStatusLabel("idle"), "준비 전");
    assert.equal(getTripStatusLabel("prep"), "예정");
    assert.equal(getTripStatusLabel("live"), "여행 중");
    assert.equal(getTripStatusLabel("after"), "결산");
  });
});
