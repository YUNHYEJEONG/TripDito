"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { receivedCouponRepository } from "../data/received-coupon-repository";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";

export const receivedCouponKeys = {
  all: ["received-coupons"] as const,
};

export function useReceivedCoupons() {
  const { isLoggedIn, isLoading } = useIsLoggedIn();
  return useQuery({
    queryKey: [...receivedCouponKeys.all, isLoggedIn],
    queryFn: () => (isLoggedIn ? receivedCouponRepository.list() : []),
    enabled: !isLoading,
  });
}

export function useReceiveCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (couponId: string) => receivedCouponRepository.receive(couponId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: receivedCouponKeys.all });
    },
  });
}
