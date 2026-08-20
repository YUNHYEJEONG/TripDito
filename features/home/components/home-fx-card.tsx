"use client";

import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useFxRate } from "@/features/fx/hooks/use-fx-rate";
import {
  getCurrencyFlagSrc,
  isFxSupported,
} from "@/features/fx/lib/currency-flags";
import { cn } from "@/lib/utils";

function formatFxAmount(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: amount >= 100 ? 0 : 2,
  }).format(amount);
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
  const { data, error, isLoading, isError, isFetching, refetch } = useFxRate(
    sameAsKrw || unsupported ? undefined : code,
  );
  const providerUnavailable =
    error instanceof Error && error.message === "RATE_PROVIDER_NOT_CONFIGURED";

  return (
    <section className="rounded-xl bg-paper-2 px-4 py-3 text-ink">
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
                width={24}
                height={24}
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
                width={24}
                height={24}
                className="size-full object-cover"
              />
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            {isLoading && !data ? (
              <p className="text-[13px] text-ink-2" role="status">
                환율 불러오는 중…
              </p>
            ) : isError && !data ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] text-muted-foreground">
                  {providerUnavailable
                    ? `${code} 환율 제공처 설정이 필요해요.`
                    : "환율을 불러오지 못했어요."}
                </p>
                {!providerUnavailable ? (
                  <button
                    type="button"
                    aria-label={isFetching ? "환율 새로고침 중" : "환율 새로고침"}
                    aria-busy={isFetching}
                    disabled={isFetching}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-2 outline-none transition-colors duration-120 hover:bg-paper-3 hover:text-ink active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
                    onClick={() => void refetch()}
                  >
                    <RefreshCw
                      className={cn("size-3.5", isFetching && "animate-spin")}
                      aria-hidden
                    />
                  </button>
                ) : null}
              </div>
            ) : data ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[18px] font-bold leading-tight tracking-tight">
                    <span className="text-foreground">{data.unitLabel}</span>{" "}
                    <span className="text-accent-text">
                      = ₩{formatFxAmount(data.krwPerUnit)}
                    </span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-[12px] leading-[1.4] font-medium text-muted-foreground">
                      {formatFxDate(data.date)}
                      {data.source === "frankfurter" ? " · 대체 환율" : " · 은행 고시"}
                    </p>
                    {data.changePct != null ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[12px] leading-[1.4] font-semibold",
                          data.changePct > 0 && "text-success-text",
                          data.changePct < 0 && "text-ink",
                          data.changePct === 0 && "text-muted-foreground",
                        )}
                      >
                        {data.changePct > 0 ? (
                          <TrendingUp className="size-3" aria-hidden />
                        ) : data.changePct < 0 ? (
                          <TrendingDown className="size-3 text-danger" aria-hidden />
                        ) : null}
                        {formatChangePct(data.changePct)}
                      </span>
                    ) : (
                      <span className="text-[12px] leading-[1.4] font-medium text-muted-foreground">
                        전일 대비 정보 없음
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={isFetching ? "환율 새로고침 중" : "환율 새로고침"}
                  aria-busy={isFetching}
                  disabled={isFetching}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-2 outline-none transition-colors duration-120 hover:bg-paper-3 hover:text-ink active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => void refetch()}
                >
                  <RefreshCw
                    className={cn("size-3.5", isFetching && "animate-spin")}
                    aria-hidden
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
