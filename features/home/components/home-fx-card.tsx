"use client";

import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useFxRate } from "@/features/fx/hooks/use-fx-rate";
import {
  getCurrencyFlagSrc,
  isFxSupported,
} from "@/features/fx/lib/currency-flags";
import { cn } from "@/lib/utils";

/** 원화 금액: 1,234.56 */
function formatKrw(amount: number): string {
  return amount.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
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
  const code = currency.toUpperCase();
  const sameAsKrw = code === "KRW";
  const unsupported = !sameAsKrw && !isFxSupported(code);
  const flagSrc = getCurrencyFlagSrc(code);
  const { data, isLoading, isError, isFetching, refetch } = useFxRate(
    sameAsKrw || unsupported ? undefined : code,
  );

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
                  환율을 불러오지 못했어요.
                </p>
                <button
                  type="button"
                  aria-label="환율 새로고침"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  onClick={() => void refetch()}
                >
                  <RefreshCw className="size-3.5" />
                </button>
              </div>
            ) : data ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[18px] font-bold leading-tight tracking-tight">
                    <span className="text-foreground">
                      {data.unitSize.toLocaleString("ko-KR")} {code}
                    </span>
                    <span className="mx-1 text-muted-foreground">=</span>
                    <span className="text-primary">
                      {formatKrw(data.krwPerUnit)}원
                    </span>
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="text-[11px] text-muted-foreground">
                      {formatFxDate(data.date)}
                    </p>
                    {data.changePct != null ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 text-[11px] font-semibold",
                          data.changePct > 0 && "text-success",
                          data.changePct < 0 && "text-error",
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
                  disabled={isFetching}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                  onClick={() => void refetch()}
                >
                  <RefreshCw
                    className={cn("size-3.5", isFetching && "animate-spin")}
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
