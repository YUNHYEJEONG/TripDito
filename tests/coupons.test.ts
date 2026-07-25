import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseTaxFreeCouponHtml } from "../features/coupons/lib/parse-taxfree-coupons";
import { filterCouponsByDestination } from "../features/coupons/lib/filter-coupons";
import { TAXFREE_COUPONS_FALLBACK } from "../features/coupons/data/taxfree-coupons";

describe("parseTaxFreeCouponHtml", () => {
  it("extracts coupon title and href from list items", () => {
    const html = `
      <ul>
        <li><a href="https://taxfreecoupon.com/34" target="_blank"><span>빅 카메라 17% 할인쿠폰</span></a></li>
        <li><a href="https://taxfreecoupon.com/133"><span>알펜 도쿄 후쿠오카 15% 할인쿠폰</span></a></li>
      </ul>
    `;
    const { coupons } = parseTaxFreeCouponHtml(html);
    assert.equal(coupons.length, 2);
    assert.equal(coupons[0]?.href, "https://taxfreecoupon.com/34");
    assert.equal(coupons[0]?.benefit, "17% OFF");
    assert.ok(coupons[1]?.regions.includes("도쿄"));
  });
});

describe("filterCouponsByDestination", () => {
  it("returns all when destination is null", () => {
    const all = filterCouponsByDestination(TAXFREE_COUPONS_FALLBACK, null);
    assert.equal(all.length, TAXFREE_COUPONS_FALLBACK.length);
  });

  it("includes nationwide coupons for tokyo", () => {
    const tokyo = filterCouponsByDestination(TAXFREE_COUPONS_FALLBACK, {
      city: "도쿄",
      country: "일본",
    });
    assert.ok(tokyo.some((c) => c.merchant === "돈키호테"));
    assert.ok(tokyo.some((c) => c.merchant === "도쿄타워"));
    assert.ok(!tokyo.some((c) => c.merchant === "USJ"));
  });
});
