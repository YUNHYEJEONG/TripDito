"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ArrowUpRight, X } from "lucide-react";
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

const subscribeToAdAvailability = () => () => {};
const getServerAdAvailability = () => false;
const getAdAvailability = () => !isShoppingAdHiddenToday();

export function ShoppingAdDialog({ ad }: { ad: ShoppingAd }) {
  const canShow = useSyncExternalStore(
    subscribeToAdAvailability,
    getAdAvailability,
    getServerAdAvailability,
  );
  const [dismissed, setDismissed] = useState(false);
  const [hideToday, setHideToday] = useState(false);
  const open = canShow && !dismissed;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && hideToday) hideShoppingAdForToday();
    setDismissed(!nextOpen);
  }

  function handleCta() {
    if (hideToday) hideShoppingAdForToday();
    setDismissed(true);

    if (ad.href.startsWith("#")) {
      const target = document.querySelector(ad.href);
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      target?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
      return;
    }

    window.open(ad.href, "_blank", "noopener,noreferrer");
  }

  const external = !ad.href.startsWith("#");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{ad.title}</DialogTitle>
          <DialogDescription>{ad.description}</DialogDescription>
        </DialogHeader>

        <div className={cn("relative text-paper", ad.tone)}>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="absolute top-2 right-2 z-10 flex size-11 items-center justify-center rounded-full bg-ink/45 text-paper outline-none transition-colors duration-120 hover:bg-ink/65 active:bg-ink/75 focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            aria-label="광고 닫기"
          >
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>

          {ad.imageSrc ? (
            <button
              type="button"
              onClick={handleCta}
              className="relative block aspect-[4/3] w-full overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-paper"
              aria-label={`${ad.ctaLabel}${external ? ", 새 창" : ""}`}
            >
              <Image
                src={ad.imageSrc}
                alt={ad.title}
                fill
                sizes="(max-width: 640px) calc(100vw - 2rem), 384px"
                className="object-cover"
              />
            </button>
          ) : (
            <div className="px-5 pt-14 pb-5">
              <p className="text-[11px] font-semibold tracking-[0.08em] text-paper/70">
                여행 전 체크
              </p>
              <h2 className="mt-1 text-[19px] leading-7 font-bold text-paper">
                {ad.title}
              </h2>
              <p className="mt-2 text-[13px] leading-5 text-paper/80">
                {ad.description}
              </p>
              <button
                type="button"
                onClick={handleCta}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-paper px-3 text-[13px] font-semibold text-ink outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                {ad.ctaLabel}
                {external ? (
                  <ArrowUpRight className="size-4" aria-hidden />
                ) : null}
                {external ? <span className="sr-only">새 창</span> : null}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-1 text-[13px] text-ink-2 outline-none focus-within:ring-2 focus-within:ring-focus">
            <Checkbox
              checked={hideToday}
              onCheckedChange={(checked) => setHideToday(checked === true)}
            />
            오늘 하루 보지 않기
          </label>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="min-h-11 rounded-lg px-3 text-[13px] font-semibold text-ink-2 outline-none transition-colors duration-120 hover:bg-paper-2 hover:text-ink active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
          >
            닫기
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
