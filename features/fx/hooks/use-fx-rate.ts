"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isFxSupported } from "@/features/fx/lib/currency-flags";
import {
  markFxSynced,
  shouldForceFxRefresh,
  todayKstIso,
} from "@/features/fx/lib/fx-schedule";

export const fxKeys = {
  all: ["fx"] as const,
  rate: (currency: string, day = todayKstIso()) =>
    [...fxKeys.all, "rate", "v4", currency, day] as const,
};

export type FxRateView = {
  currency: string;
  date: string;
  updatedDate: string;
  previousDate: string | null;
  unitSize: number;
  unitLabel: string;
  krwPerUnit: number;
  previousKrwPerUnit: number | null;
  /** Compatibility value used by the after-trip KRW calculation. */
  amountPer1000Krw: number;
  previousAmountPer1000Krw: number | null;
  changePct: number | null;
  source?: "koreaexim" | "frankfurter";
};

async function fetchFxRate(currency: string) {
  const params = new URLSearchParams({ currency });
  const response = await fetch(`/api/fx?${params}`, { cache: "no-store" });
  const body = (await response.json()) as FxRateView | { error: string };
  if (!response.ok || "error" in body) {
    throw new Error("error" in body ? body.error : `FX_HTTP_${response.status}`);
  }
  markFxSynced(currency, body.date);
  return body;
}

export function useFxRate(currency: string | undefined) {
  const queryClient = useQueryClient();
  const code = (currency ?? "").toUpperCase();
  const supported = Boolean(code) && code !== "KRW" && isFxSupported(code);
  const day = todayKstIso();
  const query = useQuery({
    queryKey: fxKeys.rate(code || "NONE", day),
    enabled: supported,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) =>
      error.message !== "RATE_PROVIDER_NOT_CONFIGURED" && failureCount < 1,
    queryFn: () => fetchFxRate(code),
  });

  useEffect(() => {
    if (!supported) return;
    const sync = () => {
      if (!shouldForceFxRefresh(code)) return;
      void fetchFxRate(code)
        .then((next) => {
          // Update both the mounted key and today's key if a long-lived tab
          // crosses midnight before React re-renders for another reason.
          queryClient.setQueryData(fxKeys.rate(code, day), next);
          queryClient.setQueryData(fxKeys.rate(code), next);
        })
        .catch(() => undefined);
    };
    // The query itself performs the initial sync. This interval only covers
    // the 11:00 KST publication boundary without double-fetching on mount.
    const timer = window.setInterval(sync, 30 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [code, day, queryClient, supported]);

  return query;
}
