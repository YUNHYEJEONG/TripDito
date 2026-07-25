import type { TaxFreeCoupon } from "../types";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export type CouponDestinationFilter = {
  city: string;
  country: string;
} | null;

/** null = 전체 */
export function filterCouponsByDestination(
  coupons: TaxFreeCoupon[],
  destination: CouponDestinationFilter,
  options?: { activeOnly?: boolean },
): TaxFreeCoupon[] {
  const list = options?.activeOnly === false
    ? coupons
    : coupons.filter((c) => c.active);

  if (!destination) return list;

  const cityKey = normalize(destination.city);
  const countryKey = normalize(destination.country);

  return list.filter((coupon) => {
    if (normalize(coupon.country) !== countryKey) return false;

    const regions = coupon.regions.map(normalize);
    if (regions.includes("전국") || regions.length === 0) return true;
    return regions.some(
      (region) => region === cityKey || cityKey.includes(region) || region.includes(cityKey),
    );
  });
}

export function listCouponDestinations(coupons: TaxFreeCoupon[]) {
  const map = new Map<string, { city: string; country: string }>();
  for (const coupon of coupons) {
    for (const region of coupon.regions) {
      if (region === "전국") continue;
      const key = `${coupon.country}::${region}`;
      if (!map.has(key)) {
        map.set(key, { city: region, country: coupon.country });
      }
    }
  }
  return [...map.values()].sort((a, b) => a.city.localeCompare(b.city, "ko"));
}
