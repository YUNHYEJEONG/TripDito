import {
  getJson,
  resolveLocalStorageKey,
  setJson,
} from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import type { TaxFreeCoupon } from "../types";
import type { ReceivedCoupon } from "../types/received-coupon";
import { getCouponCanonicalId } from "../lib/coupon-identity";

const META_SEEDED = `${storageKeys.receivedCoupons}:seeded`;

function readRaw(): ReceivedCoupon[] {
  return getJson<ReceivedCoupon[]>(storageKeys.receivedCoupons, []);
}

function write(coupons: ReceivedCoupon[]) {
  setJson(storageKeys.receivedCoupons, coupons);
}

function canonicalize(coupon: ReceivedCoupon): ReceivedCoupon {
  return { ...coupon, id: getCouponCanonicalId(coupon) };
}

function readCanonical(): ReceivedCoupon[] {
  const raw = readRaw();
  const deduped = new Map<string, ReceivedCoupon>();
  for (const item of raw) {
    const coupon = canonicalize(item);
    const existing = deduped.get(coupon.id);
    if (
      !existing ||
      new Date(coupon.receivedAt).getTime() >
        new Date(existing.receivedAt).getTime()
    ) {
      deduped.set(coupon.id, coupon);
    }
  }
  const coupons = [...deduped.values()];
  if (
    coupons.length !== raw.length ||
    coupons.some((coupon, index) => coupon.id !== raw[index]?.id)
  ) {
    write(coupons);
  }
  return coupons;
}

const LEGACY_DEMO_IDS = new Set(["donki-17", "bic-17", "alpen-15"]);

/** 이전 버전이 자동 주입한 쿠폰만 한 번 제거한다. */
function removeLegacyDemoSeed() {
  if (typeof window === "undefined") return;
  const metaKey = resolveLocalStorageKey(META_SEEDED);
  if (localStorage.getItem(metaKey) !== "1") return;
  write(readRaw().filter((coupon) => !LEGACY_DEMO_IDS.has(coupon.id)));
  localStorage.removeItem(metaKey);
}

export const receivedCouponRepository = {
  list(): ReceivedCoupon[] {
    removeLegacyDemoSeed();
    return readCanonical().sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
    );
  },

  count(): number {
    return this.list().length;
  },

  receive(coupon: TaxFreeCoupon): ReceivedCoupon {
    const id = getCouponCanonicalId(coupon);
    const current = readCanonical();
    const existing = current.find((item) => item.id === id);
    if (existing) return existing;
    const received: ReceivedCoupon = {
      ...coupon,
      id,
      receivedAt: new Date().toISOString(),
    };
    write([received, ...current]);
    return received;
  },

  remove(id: string) {
    write(
      readCanonical().filter(
        (coupon) =>
          coupon.id !== id && getCouponCanonicalId(coupon) !== id,
      ),
    );
  },
};
