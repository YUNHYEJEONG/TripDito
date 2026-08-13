"use client";

import { useState } from "react";
import { BadgePercent, ChevronDown, ExternalLink } from "lucide-react";
import type { CoupangDeal } from "@/features/shopping-items/schema";
import { cn } from "@/lib/utils";

function safeDealUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function CoupangDealCard({ deal }: { deal: CoupangDeal }) {
  const [open, setOpen] = useState(false);
  const href = safeDealUrl(deal.url);

  return (
    <aside className="mt-2 overflow-hidden rounded-xl border border-accent/25 bg-brand-soft/55">
      <button
        type="button"
        className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <BadgePercent className="size-4 shrink-0 text-accent-text" aria-hidden />
        <span className="min-w-0 flex-1 text-[12px] font-semibold text-accent-text">
          예상가보다 5% 이상 저렴한 상품을 찾았어요
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-accent-text transition-transform duration-120",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-accent/20 px-3 py-3">
          <p className="line-clamp-2 text-[13px] font-medium leading-5 text-foreground">
            {deal.title}
          </p>
          <p className="mt-1 text-[13px] font-semibold text-foreground">
            1개당 {deal.unitPriceKrw.toLocaleString("ko-KR")}원
          </p>
          <p className="mt-1 text-[11px] leading-4 text-ink-2">
            가격과 배송비는 판매 페이지에서 최종 확인해 주세요.
          </p>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg font-semibold text-[13px] text-accent-text outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              쿠팡에서 확인
              <ExternalLink className="size-4" aria-hidden />
            </a>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
