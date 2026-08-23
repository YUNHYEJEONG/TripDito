import { api, isUnauthorized } from "@/lib/api/client";
import type { ReceivedCoupon } from "../types/received-coupon";

export const receivedCouponRepository = {
  /** 프로필 > 내가 받은 쿠폰. 미로그인이면 빈 목록 */
  async list(): Promise<ReceivedCoupon[]> {
    try {
      return await api<ReceivedCoupon[]>("/api/me/coupons");
    } catch (error) {
      if (isUnauthorized(error)) return [];
      throw error;
    }
  },

  receive(couponId: string): Promise<ReceivedCoupon[]> {
    return api<ReceivedCoupon[]>("/api/me/coupons", {
      method: "POST",
      body: { couponId },
    });
  },

  async remove(couponId: string): Promise<void> {
    await api(`/api/me/coupons/${couponId}`, { method: "DELETE" });
  },
};
