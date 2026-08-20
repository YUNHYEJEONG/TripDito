import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BOTTOM_NAV_ITEMS,
  getActiveBottomNavItem,
} from "../components/layout/bottom-nav-items";

describe("bottom navigation", () => {
  it("keeps Home in the middle of five icon-only destinations with accessible names", () => {
    assert.deepEqual(
      BOTTOM_NAV_ITEMS.map(({ ariaLabel, href }) => [ariaLabel, href]),
      [
        ["쇼핑", "/shopping"],
        ["때샷", "/shots"],
        ["홈", "/home"],
        ["여권", "/passport"],
        ["프로필", "/profile"],
      ],
    );
    assert.equal(BOTTOM_NAV_ITEMS[2]?.id, "home");
  });

  it("keeps shopping-list flows under Home and trip management under Passport", () => {
    assert.equal(getActiveBottomNavItem("/home"), "home");
    assert.equal(getActiveBottomNavItem("/trips/new"), "home");
    assert.equal(getActiveBottomNavItem("/trips/trip-1"), "home");
    assert.equal(getActiveBottomNavItem("/my-trips"), "passport");
    assert.equal(getActiveBottomNavItem("/passport"), "passport");
    assert.equal(getActiveBottomNavItem("/passport/trip-1"), null);
    assert.equal(getActiveBottomNavItem("/shopping-list"), null);
    assert.equal(getActiveBottomNavItem("/tripster"), null);
  });

});
