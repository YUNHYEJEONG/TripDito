"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { ShoppingAd } from "../data/demo-shopping-content";
import {
  hideShoppingAdForToday,
  isShoppingAdHiddenToday,
} from "../lib/ad-dismiss";
import { cn } from "@/lib/utils";

export function ShoppingAdDialog({ ad }: { ad: ShoppingAd }) {
  const [open, setOpen] = useState(false);
  const [hideToday, setHideToday] = useState(false);

  useEffect(() => {
    if (isShoppingAdHiddenToday()) return;
    setOpen(true);
  }, []);

  function handleClose(nextOpen: boolean) {
    if (!nextOpen && hideToday) {
      hideShoppingAdForToday();
    }
    setOpen(nextOpen);
  }

  function handleCta() {
    if (hideToday) hideShoppingAdForToday();
    setOpen(false);
    if (ad.href.startsWith("#")) {
      const el = document.querySelector(ad.href);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.open(ad.href, "_blank", "noopener,noreferrer");
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-sm"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{ad.title}</DialogTitle>
          <DialogDescription>{ad.description}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="absolute top-2.5 right-2.5 z-10 flex size-8 items-center justify-center text-white"
            aria-label="닫기"
          >
            <XIcon className="size-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]" strokeWidth={2.5} />
          </button>

          {ad.imageSrc ? (
            <button
              type="button"
              onClick={handleCta}
              className="block w-full overflow-hidden bg-[#0B1220] text-left outline-none"
              aria-label={ad.ctaLabel}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.imageSrc}
                alt={ad.title}
                className="h-auto w-full"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCta}
              className={cn(
                "w-full px-5 pb-4 pt-10 text-left text-white outline-none",
                ad.tone,
              )}
            >
              <p className="text-[18px] font-bold leading-snug">{ad.title}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/85">
                {ad.description}
              </p>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-muted-foreground">
            <Checkbox
              checked={hideToday}
              onCheckedChange={(checked) => setHideToday(checked === true)}
            />
            오늘 하루 보지 않기
          </label>
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="text-[13px] font-medium text-muted-foreground underline-offset-2 hover:underline"
          >
            닫기
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
