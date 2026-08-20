import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getLivePurchaseProgressHref } from "../features/home/components/home-status-hero";
import { getHomeTripCardAction } from "../features/home/components/home-upcoming-trip-card";
import { tripCardStatusFromHomeMode } from "../features/trips/components/trip-card";
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
  it("opens the trip detail from the hero card in every state", () => {
    // 여행 중에만 지도로 새면 같은 자리를 눌렀는데 다른 곳이 열린다.
    const live = getHomeTripCardAction(trip(), "2026-08-13");

    assert.equal(live.href, "/trips/taipei-trip?returnTo=%2Fhome");
    assert.equal(live.label, "여행 중인 쇼핑 계획 보기");
    assert.equal(live.ariaLabel, "타이베이 여행 쇼핑 계획 보기");
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

  it("shows one trip status badge everywhere, not a per-screen label set", () => {
    // 여행 탭 카드와 홈의 여행 전환 시트가 같은 배지를 쓴다.
    assert.equal(tripCardStatusFromHomeMode("live"), "live");
    assert.equal(tripCardStatusFromHomeMode("after"), "complete");
    // 먼 미래(idle)도 사용자에게는 그냥 출발 예정이다.
    assert.equal(tripCardStatusFromHomeMode("prep"), "prep");
    assert.equal(tripCardStatusFromHomeMode("idle"), "prep");
  });
});
