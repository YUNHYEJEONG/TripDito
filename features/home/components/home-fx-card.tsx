"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import {
  fxKeys,
  getFxErrorMessage,
  refreshFxRate,
  useFxRate,
} from "@/features/fx/hooks/use-fx-rate";
import {
  getCurrencyFlagSrc,
  isFxSupported,
} from "@/features/fx/lib/currency-flags";
import { todayKstIso } from "@/features/fx/lib/fx-schedule";
import { cn } from "@/lib/utils";

/** 원화 금액 (천단위 콤마, 소수 최대 2자리) */
function formatKrwAmount(amount: number): string {
  return amount.toLocaleString("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** YYYY-MM-DD → YYYY.MM.DD */
function formatFxDate(isoDate: string): string {
  return isoDate.replaceAll("-", ".");
}

function formatChangePct(pct: number): string {
  const abs = Math.abs(pct);
  const digits = abs >= 1 ? 2 : 3;
  const formatted = abs.toFixed(digits);
  return `${pct > 0 ? "+" : pct < 0 ? "−" : ""}${formatted}%`;
}

export function HomeFxCard({ currency }: { currency: string }) {
  const queryClient = useQueryClient();
  const code = currency.toUpperCase();
  const sameAsKrw = code === "KRW";
  const unsupported = !sameAsKrw && !isFxSupported(code);
  const flagSrc = getCurrencyFlagSrc(code);
  const today = todayKstIso();
  const { data, isLoading, isError, isFetching, error } = useFxRate(
    sameAsKrw || unsupported ? undefined : code,
  );
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const next = await refreshFxRate(code);
      queryClient.setQueryData(fxKeys.rate(code, today), next);
    } catch {
      /* 에러는 기존 데이터 유지, 메시지 필요 시 확장 */
    } finally {
      setRefreshing(false);
    }
  };

  const busy = isFetching || refreshing;

  return (
    <section className="rounded-2xl bg-surface-gray px-3 py-2 text-surface-gray-foreground">
      {sameAsKrw ? (
        <p className="text-[13px] text-muted-foreground">
          여행 통화가 원화(KRW)라 환율 표시가 필요 없어요.
        </p>
      ) : unsupported ? (
        <div className="flex items-center gap-2">
          {flagSrc ? (
            <div className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary ring-1 ring-border/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={flagSrc}
                alt=""
                className="size-full object-cover"
              />
            </div>
          ) : null}
          <p className="text-[13px] text-muted-foreground">
            {code} 환율 정보를 준비 중이에요.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {flagSrc ? (
            <div className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary ring-1 ring-border/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={flagSrc}
                alt=""
                className="size-full object-cover"
              />
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            {isLoading && !data ? (
              <p className="text-[13px] text-muted-foreground">
                환율 불러오는 중…
              </p>
            ) : isError && !data ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] text-muted-foreground">
                  {getFxErrorMessage(
                    error instanceof Error ? error.message : undefined,
                  )}
                </p>
                <button
                  type="button"
                  aria-label="환율 새로고침"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  onClick={() => void onRefresh()}
                >
                  <RefreshCw className="size-3.5" />
                </button>
              </div>
            ) : data ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium leading-tight text-muted-foreground">
                    {data.unitLabel}
                  </p>
                  <p className="mt-0.5 text-[18px] leading-tight tracking-tight">
                    <span className="font-bold text-primary">
                      {formatKrwAmount(data.krwPerUnit)}
                    </span>
                    <span className="font-normal text-foreground"> 원</span>
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="text-[11px] text-muted-foreground">
                      {formatFxDate(data.updatedDate ?? data.date)}
                      {data.source === "frankfurter" ? " · 대체시세" : ""}
                    </p>
                    {data.changePct != null ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 text-[11px] font-semibold",
                          data.changePct > 0 && "text-error",
                          data.changePct < 0 && "text-success",
                          data.changePct === 0 && "text-muted-foreground",
                        )}
                      >
                        {data.changePct > 0 ? (
                          <TrendingUp className="size-3" aria-hidden />
                        ) : data.changePct < 0 ? (
                          <TrendingDown className="size-3" aria-hidden />
                        ) : null}
                        {formatChangePct(data.changePct)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        전일 대비 —
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="환율 새로고침"
                  disabled={busy}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                  onClick={() => void onRefresh()}
                >
                  <RefreshCw
                    className={cn("size-3.5", busy && "animate-spin")}
                  />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
