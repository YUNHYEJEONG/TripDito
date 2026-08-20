import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPassportStampHeadingLabel,
  getPassportStampIntentHref,
  getPassportStampPageNumber,
  getPassportStampTripId,
  getPassportView,
  getPassportViewHref,
} from "../features/profile/utils/passport-view";

describe("passport hub view", () => {
  it("opens trip management by default", () => {
    assert.equal(getPassportView(undefined), "trips");
    assert.equal(getPassportView(null), "trips");
    assert.equal(getPassportView("unknown"), "trips");
    assert.equal(getPassportView(["unknown", "stamps"]), "trips");
    assert.equal(getPassportViewHref("trips"), "/passport");
  });

  it("keeps the passport stamp screen directly linkable", () => {
    assert.equal(getPassportView("stamps"), "stamps");
    assert.equal(getPassportView(["stamps"]), "stamps");
    assert.equal(getPassportViewHref("stamps"), "/passport?view=stamps");
  });

  it("keeps the embedded heading stable until local trips have loaded", () => {
    assert.equal(getPassportStampHeadingLabel(true, 0), "여행 도장");
    assert.equal(getPassportStampHeadingLabel(true, 6), "여행 도장");
    assert.equal(
      getPassportStampHeadingLabel(false, 6),
      "여행 도장 · 완료한 여행 6개",
    );
  });

  it("sanitizes stamp target and physical page query values", () => {
    assert.equal(getPassportStampTripId("  trip/1  "), "trip/1");
    assert.equal(getPassportStampTripId(["trip-1", "trip-2"]), "trip-1");
    assert.equal(getPassportStampTripId("bad\ntrip"), null);
    assert.equal(getPassportStampTripId("x".repeat(201)), null);

    assert.equal(getPassportStampPageNumber("1"), 1);
    assert.equal(getPassportStampPageNumber(["100", "2"]), 100);
    assert.equal(getPassportStampPageNumber("0"), null);
    assert.equal(getPassportStampPageNumber("101"), null);
    assert.equal(getPassportStampPageNumber("1.5"), null);
  });

  it("builds an encoded, internal stamp-intent deep link", () => {
    assert.equal(
      getPassportStampIntentHref("trip-1", "/trips/trip-1"),
      "/passport?view=stamps&stampTripId=trip-1&returnTo=%2Ftrips%2Ftrip-1",
    );
    assert.equal(
      getPassportStampIntentHref("trip/1", "/trips/trip 1?tab=items#done", 3),
      "/passport?view=stamps&stampTripId=trip%2F1&returnTo=%2Ftrips%2Ftrip%25201%3Ftab%3Ditems%23done&stampPage=3",
    );
  });

  it("rejects unsafe returns and malformed target ids", () => {
    assert.equal(
      getPassportStampIntentHref("trip-1", "https://evil.example/steal"),
      "/passport?view=stamps&stampTripId=trip-1&returnTo=%2Fpassport%3Fview%3Dstamps",
    );
    assert.equal(
      getPassportStampIntentHref("\n", "/trips/one"),
      "/passport?view=stamps",
    );
    assert.equal(
      getPassportStampIntentHref("trip-1", "/trips/one", 101),
      "/passport?view=stamps&stampTripId=trip-1&returnTo=%2Ftrips%2Fone",
    );
  });
});
