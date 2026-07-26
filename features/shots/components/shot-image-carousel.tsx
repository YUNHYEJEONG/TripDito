"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImagePin } from "../schema";
import { useMouseDragScroll } from "../hooks/use-mouse-drag-scroll";

function readCarouselIndex(scroller: HTMLElement, total: number) {
  const slide = scroller.firstElementChild as HTMLElement | null;
  const slideWidth = slide?.getBoundingClientRect().width ?? scroller.clientWidth;
  if (!slideWidth || total <= 0) return 0;
  return Math.min(
    Math.max(Math.round(scroller.scrollLeft / slideWidth), 0),
    total - 1,
  );
}

export function ShotImageCarousel({
  images,
  pins = [],
  className,
  /** 피드가 화면 중앙에 있을 때 핀 코멘트 자동 펼침 */
  autoExpandPins = false,
}: {
  images: string[];
  pins?: ImagePin[];
  className?: string;
  autoExpandPins?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [openPinIds, setOpenPinIds] = useState<Set<string>>(() => new Set());
  const manualClosedRef = useRef<Set<string>>(new Set());

  const total = images.length;
  const currentPins = pins.filter((pin) => pin.imageIndex === index);
  const currentPinKey = currentPins.map((pin) => pin.id).join("|");

  useMouseDragScroll(scrollerRef, total > 1);

  useEffect(() => {
    setIndex(0);
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [images]);

  useEffect(() => {
    setOpenPinIds(new Set());
    manualClosedRef.current = new Set();
  }, [index]);

  useEffect(() => {
    if (!autoExpandPins) {
      setOpenPinIds(new Set());
      manualClosedRef.current = new Set();
      return;
    }
    const ids = currentPinKey ? currentPinKey.split("|") : [];
    setOpenPinIds(
      new Set(ids.filter((id) => !manualClosedRef.current.has(id))),
    );
  }, [autoExpandPins, index, currentPinKey]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || total <= 1) return;

    const slides = Array.from(root.children);
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;
        const next = slides.indexOf(best.target);
        if (next < 0) return;
        setIndex((prev) => (prev === next ? prev : next));
      },
      { root, threshold: [0.55, 0.75, 0.9] },
    );

    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [images, total]);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el || total <= 1) return;
    const next = readCarouselIndex(el, total);
    setIndex((prev) => (prev === next ? prev : next));
  }

  function togglePin(pinId: string) {
    setOpenPinIds((prev) => {
      const next = new Set(prev);
      if (next.has(pinId)) {
        next.delete(pinId);
        if (autoExpandPins) manualClosedRef.current.add(pinId);
      } else {
        next.add(pinId);
        manualClosedRef.current.delete(pinId);
      }
      return next;
    });
  }

  return (
    <div className={cn("relative aspect-square", className)}>
      <div
        ref={scrollerRef}
        className={cn(
          "flex size-full snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          total > 1 && "cursor-grab select-none",
        )}
        onScroll={handleScroll}
      >
        {images.map((src, i) => (
          <div
            key={`${src.slice(0, 24)}-${i}`}
            className="relative aspect-square min-w-full shrink-0 basis-full snap-start bg-[#F2F4F6]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="pointer-events-none size-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {total > 1 ? (
        <span className="pointer-events-none absolute top-3 right-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white tabular-nums">
          {index + 1}/{total}
        </span>
      ) : null}

      {currentPins.map((pin) => {
        const open = openPinIds.has(pin.id);
        return (
          <div
            key={pin.id}
            className="absolute z-10"
            style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%` }}
          >
            <button
              type="button"
              aria-label="핀 코멘트"
              aria-expanded={open}
              className="-translate-x-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-primary text-white shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                togglePin(pin.id);
              }}
            >
              <Plus className="size-4" strokeWidth={2.5} />
            </button>
            {open ? (
              <div className="absolute top-1/2 left-1/2 z-20 mt-1 w-48 -translate-x-1/2 rounded-xl bg-white px-3 py-2 text-[12px] leading-snug text-foreground shadow-lg">
                {pin.text}
              </div>
            ) : null}
          </div>
        );
      })}

      {total > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full shadow-sm transition-all",
                i === index ? "w-4 bg-white" : "w-1.5 bg-white/50",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
