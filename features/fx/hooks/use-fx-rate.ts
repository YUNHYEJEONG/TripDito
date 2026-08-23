"use client";

import { useQuery } from "@tanstack/react-query";
import { isFxSupported } from "@/features/fx/lib/currency-flags";

export const fxKeys = {
  all: ["fx"] as const,
  rate: (currency: string) => [...fxKeys.all, "koreaexim", currency] as const,
};

export type FxRateView = {
  currency: string;
  date: string;
  previousDate: string | null;
  /** 외화 unitSize 단위당 원화 (매매기준율) */
  unitSize: number;
  krwPerUnit: number;
  previousKrwPerUnit: number | null;
  /** 참고용: 1,000원당 외화 */
  amountPer1000Krw: number;
  previousAmountPer1000Krw: number | null;
  changePct: number | null;
};

type FxApiSuccess = FxRateView;
type FxApiError = { error: string };

export function useFxRate(currency: string | undefined) {
  const code = (currency ?? "").toUpperCase();
  const supported = Boolean(code) && isFxSupported(code) && code !== "KRW";

  return useQuery({
    queryKey: fxKeys.rate(code || "NONE"),
    enabled: supported,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<FxRateView> => {
      const res = await fetch(`/api/fx?currency=${encodeURIComponent(code)}`, {
        cache: "no-store",
      });
      const body = (await res.json()) as FxApiSuccess | FxApiError;
      if (!res.ok || "error" in body) {
        throw new Error(
          "error" in body ? body.error : `FX_HTTP_${res.status}`,
        );
      }
      return body;
    },
  });
}
