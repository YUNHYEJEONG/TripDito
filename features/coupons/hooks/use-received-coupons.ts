"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { receivedCouponRepository } from "../data/received-coupon-repository";
import type { TaxFreeCoupon } from "../types";

export const receivedCouponKeys = {
  all: ["received-coupons"] as const,
};

export function useReceivedCoupons() {
  return useQuery({
    queryKey: receivedCouponKeys.all,
    queryFn: () => receivedCouponRepository.list(),
  });
}

export function useReceiveCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: TaxFreeCoupon) =>
      receivedCouponRepository.receive(coupon),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: receivedCouponKeys.all });
    },
  });
}

export function useRemoveReceivedCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => receivedCouponRepository.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: receivedCouponKeys.all });
    },
  });
}
