import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import {
  DEMO_RECEIVED_COUPONS,
  type ReceivedCoupon,
} from "../types/received-coupon";

const META_SEEDED = `${storageKeys.receivedCoupons}:seeded`;

function readRaw(): ReceivedCoupon[] {
  return getJson<ReceivedCoupon[]>(storageKeys.receivedCoupons, []);
}

function write(coupons: ReceivedCoupon[]) {
  setJson(storageKeys.receivedCoupons, coupons);
}

/** 최초 1회 데모 쿠폰을 넣어 빈 목록을 피함 (PoC) */
function ensureDemoSeed() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(META_SEEDED) === "1") return;
  if (readRaw().length === 0) {
    write(DEMO_RECEIVED_COUPONS);
  }
  localStorage.setItem(META_SEEDED, "1");
}

export const receivedCouponRepository = {
  list(): ReceivedCoupon[] {
    ensureDemoSeed();
    return readRaw().sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
    );
  },

  count(): number {
    return this.list().length;
  },
};
