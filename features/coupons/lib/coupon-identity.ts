import type { TaxFreeCoupon } from "../types";

function normalizeText(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
}

function normalizeHref(href: string) {
  try {
    const url = new URL(href);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    url.searchParams.sort();
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return href.trim().toLocaleLowerCase("en-US");
  }
}

function hashKey(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/** 원격 목록의 순서나 live/fallback 전환과 무관한 쿠폰 식별자. */
export function getCouponCanonicalId(
  coupon: Pick<TaxFreeCoupon, "href" | "merchant" | "title">,
) {
  const key = [
    normalizeHref(coupon.href),
    normalizeText(coupon.merchant),
    normalizeText(coupon.title),
  ].join("::");
  return `tf-${hashKey(key)}`;
}
