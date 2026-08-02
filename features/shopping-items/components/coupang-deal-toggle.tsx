"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { CoupangDeal } from "../schema";
import { cn } from "@/lib/utils";

export function CoupangDealToggle({ deal }: { deal: CoupangDeal }) {
  const [open, setOpen] = useState(false);
  const priceLabel = deal.unitPriceKrw.toLocaleString("ko-KR");

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-primary/20 bg-primary/5">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0 flex-1 text-[12px] font-semibold text-primary">
          좀 더 저렴한 상품을 찾았어요
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-primary transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-primary/15 px-3 py-2.5">
          <a
            href={deal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[13px] font-medium text-foreground transition-colors hover:text-primary"
          >
            <span className="min-w-0 flex-1">
              쿠팡에서 1개당 {priceLabel}원 상품 보러가기
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </a>
        </div>
      ) : null}
    </div>
  );
}
