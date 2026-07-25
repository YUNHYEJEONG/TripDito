"use client";

import { useQuery } from "@tanstack/react-query";
import type { CouponsResponse } from "../types";

export const couponKeys = {
  all: ["coupons"] as const,
  taxfree: () => [...couponKeys.all, "taxfree"] as const,
};

export function useTaxFreeCoupons() {
  return useQuery({
    queryKey: couponKeys.taxfree(),
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<CouponsResponse> => {
      const res = await fetch("/api/coupons", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`COUPONS_HTTP_${res.status}`);
      }
      return (await res.json()) as CouponsResponse;
    },
  });
}
