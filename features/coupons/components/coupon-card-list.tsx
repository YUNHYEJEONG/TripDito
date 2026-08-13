"use client";

import { ExternalLink, Ticket } from "lucide-react";
import { toast } from "sonner";
import type { TaxFreeCoupon } from "../types";
import type { ReceivedCoupon } from "../types/received-coupon";
import {
  useReceiveCoupon,
  useReceivedCoupons,
  useRemoveReceivedCoupon,
} from "../hooks/use-received-coupons";

export function CouponCardList({
  coupons,
  action = "none",
}: {
  coupons: Array<TaxFreeCoupon | ReceivedCoupon>;
  action?: "none" | "receive" | "remove";
}) {
  const { data: received = [] } = useReceivedCoupons();
  const receiveCoupon = useReceiveCoupon();
  const removeCoupon = useRemoveReceivedCoupon();
  const receivedIds = new Set(received.map((coupon) => coupon.id));

  return (
    <ul className="overflow-hidden rounded-2xl border border-rule bg-paper">
      {coupons.map((coupon, index) => {
        const isReceived = receivedIds.has(coupon.id);
        const isReceiving =
          receiveCoupon.isPending && receiveCoupon.variables?.id === coupon.id;
        const isRemoving =
          removeCoupon.isPending && removeCoupon.variables === coupon.id;
        const localRegions = coupon.regions.filter(
          (region) => region !== "전국",
        );
        const regionLabel =
          coupon.regions.length > 0
            ? localRegions.length > 0
              ? localRegions.join(", ")
              : "일본 전국"
            : null;

        return (
          <li key={coupon.id} className="px-4">
            {index > 0 ? (
              <div className="border-t border-border/80" aria-hidden />
            ) : null}
            <div className="flex items-center gap-2 py-2">
              <a
                href={coupon.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-start gap-3 rounded-lg py-2 outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
              >
                <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Ticket className="size-4 text-primary" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] leading-snug font-semibold text-foreground">
                    {coupon.title}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {coupon.merchant}
                    {regionLabel ? (
                      <>
                        <span className="mx-2 text-border">·</span>
                        {regionLabel}
                      </>
                    ) : null}
                  </p>
                  {action === "remove" && "receivedAt" in coupon ? (
                    <p className="mt-1 text-[12px] text-ink-2">
                      {formatReceivedDate(coupon.receivedAt)} 보관 · 조건 재확인
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-accent-text">
                    {coupon.benefit}
                  </span>
                  <ExternalLink
                    className="size-3.5 text-muted-foreground"
                    aria-hidden
                  />
                </div>
              </a>
              {action === "receive" ? (
                <button
                  type="button"
                  aria-busy={isReceiving}
                  disabled={isReceived || isReceiving}
                  onClick={() =>
                    receiveCoupon.mutate(coupon, {
                      onError: () =>
                        toast.error(
                          "쿠폰을 보관하지 못했어요. 다시 시도해 주세요.",
                        ),
                    })
                  }
                  className="inline-flex min-h-11 shrink-0 items-center rounded-lg bg-paper-2 px-3 text-[13px] font-semibold whitespace-nowrap text-accent-text outline-none transition-colors duration-120 hover:bg-paper-3 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:bg-paper-3 disabled:text-ink-2"
                >
                  {isReceived ? "받음" : isReceiving ? "받는 중" : "받기"}
                </button>
              ) : null}
              {action === "remove" ? (
                <button
                  type="button"
                  aria-busy={isRemoving}
                  disabled={isRemoving}
                  onClick={() =>
                    removeCoupon.mutate(coupon.id, {
                      onError: () =>
                        toast.error(
                          "쿠폰 보관을 해제하지 못했어요. 다시 시도해 주세요.",
                        ),
                    })
                  }
                  className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 text-[12px] font-semibold whitespace-nowrap text-ink-2 outline-none transition-colors duration-120 hover:bg-paper-2 hover:text-ink active:bg-paper-3 active:text-ink focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:bg-paper-2 disabled:text-ink-2"
                >
                  {isRemoving ? "해제 중" : "보관 해제"}
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function formatReceivedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "보관일 미상";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
