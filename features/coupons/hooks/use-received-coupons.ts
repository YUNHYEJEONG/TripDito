"use client";

import { useQuery } from "@tanstack/react-query";
import { receivedCouponRepository } from "../data/received-coupon-repository";

export const receivedCouponKeys = {
  all: ["received-coupons"] as const,
};

export function useReceivedCoupons() {
  return useQuery({
    queryKey: receivedCouponKeys.all,
    queryFn: () => receivedCouponRepository.list(),
  });
}
