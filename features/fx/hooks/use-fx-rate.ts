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
  rate: (currency: string, day: string) =>
    [...fxKeys.all, "rate", "v4", currency, day] as const,
};

export type FxRateView = {
  currency: string;
  /** 환율 데이터 기준일 (은행 고시일) */
  date: string;
  /** 화면에 보이는 업데이트 일자 (조회 시점 KST) */
  updatedDate: string;
  previousDate: string | null;
  unitSize: number;
  unitLabel: string;
  /** 화면 단위당 원화 */
  krwPerUnit: number;
  previousKrwPerUnit: number | null;
  changePct: number | null;
  source?: "koreaexim" | "frankfurter";
};

type FxApiSuccess = FxRateView;
type FxApiError = { error: string };

const ERROR_LABEL: Record<string, string> = {
  RATE_LIMITED: "환율 API 호출 한도를 초과했어요. 잠시 후 다시 시도해 주세요.",
  AUTH_ERROR: "환율 API 인증에 실패했어요.",
  MISSING_AUTH_KEY: "환율 API 키가 설정되지 않았어요.",
  NO_RATE_DATA: "최근 영업일 환율을 찾지 못했어요.",
  FRANKFURTER_NO_RATE: "대체 환율 정보를 불러오지 못했어요.",
};

export function getFxErrorMessage(code: string | undefined): string {
  if (!code) return "환율을 불러오지 못했어요.";
  return ERROR_LABEL[code] ?? "환율을 불러오지 못했어요.";
}

async function fetchFxRateApi(
  currency: string,
  options?: { refresh?: boolean },
): Promise<FxRateView> {
  const code = currency.toUpperCase();
  const params = new URLSearchParams({ currency: code });
  if (options?.refresh) params.set("refresh", "1");

  const res = await fetch(`/api/fx?${params.toString()}`, {
    cache: "no-store",
  });
  const body = (await res.json()) as FxApiSuccess | FxApiError;
  if (!res.ok || ("error" in body && body.error)) {
    throw new Error(
      "error" in body && body.error ? body.error : `FX_HTTP_${res.status}`,
    );
  }
  const data = body as FxApiSuccess;
  markFxSynced(code, data.date);
  return data;
}

export function useFxRate(currency: string | undefined) {
  const queryClient = useQueryClient();
  const code = (currency ?? "").toUpperCase();
  const supported = Boolean(code) && isFxSupported(code) && code !== "KRW";
  const today = todayKstIso();

  const query = useQuery({
    queryKey: fxKeys.rate(code || "NONE", today),
    enabled: supported,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    queryFn: async (): Promise<FxRateView> => {
      const force = shouldForceFxRefresh(code);
      return fetchFxRateApi(code, { refresh: force });
    },
  });

  // 앱을 켠 채로 고시 시각(11시)이 지나면 한 번 더 동기화
  useEffect(() => {
    if (!supported) return;

    const syncIfNeeded = () => {
      if (!shouldForceFxRefresh(code)) return;
      void fetchFxRateApi(code, { refresh: true })
        .then((next) => {
          queryClient.setQueryData(fxKeys.rate(code, todayKstIso()), next);
        })
        .catch(() => {
          /* 다음 interval에서 재시도 */
        });
    };

    syncIfNeeded();
    const id = window.setInterval(syncIfNeeded, 30 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [supported, code, queryClient]);

  return query;
}

export async function refreshFxRate(currency: string): Promise<FxRateView> {
  return fetchFxRateApi(currency, { refresh: true });
}
