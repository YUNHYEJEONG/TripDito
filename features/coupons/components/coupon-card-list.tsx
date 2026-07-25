"use client";

import { ExternalLink, Ticket } from "lucide-react";
import type { TaxFreeCoupon } from "../types";

export function CouponCardList({ coupons }: { coupons: TaxFreeCoupon[] }) {
  return (
    <ul className="overflow-hidden rounded-2xl border border-border/80 bg-background">
      {coupons.map((coupon, index) => (
        <li key={coupon.id} className="px-4">
          {index > 0 ? (
            <div className="border-t border-border/80" aria-hidden />
          ) : null}
          <a
            href={coupon.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 py-3 transition-colors active:bg-muted/40"
          >
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Ticket className="size-4 text-primary" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold leading-snug text-foreground">
                {coupon.title}
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {coupon.merchant}
                {coupon.regions.length > 0 ? (
                  <>
                    <span className="mx-1.5 text-border">·</span>
                    {coupon.regions.filter((r) => r !== "전국").length
                      ? coupon.regions.filter((r) => r !== "전국").join(", ")
                      : "일본 전국"}
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                {coupon.benefit}
              </span>
              <ExternalLink
                className="size-3.5 text-muted-foreground"
                aria-hidden
              />
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
