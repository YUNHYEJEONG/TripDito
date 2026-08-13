"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
  alt,
  className,
  preloadFirstImage = false,
}: {
  images: string[];
  pins?: ImagePin[];
  alt: string;
  className?: string;
  preloadFirstImage?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [openPinId, setOpenPinId] = useState<string | null>(null);

  const total = images.length;
  const currentPins = pins.filter((pin) => pin.imageIndex === index);

  useMouseDragScroll(scrollerRef, total > 1);

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
        setIndex((previous) => (previous === next ? previous : next));
        setOpenPinId(null);
      },
      { root, threshold: [0.55, 0.75, 0.9] },
    );

    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [images, total]);

  function handleScroll() {
    const scroller = scrollerRef.current;
    if (!scroller || total <= 1) return;
    const next = readCarouselIndex(scroller, total);
    setIndex((previous) => (previous === next ? previous : next));
    if (next !== index) setOpenPinId(null);
  }

  function moveTo(nextIndex: number) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const bounded = Math.min(Math.max(nextIndex, 0), total - 1);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    scroller.scrollTo({
      left: bounded * scroller.clientWidth,
      behavior: reduceMotion ? "auto" : "smooth",
    });
    setIndex(bounded);
    setOpenPinId(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (total <= 1) return;

    if (event.key === "ArrowRight") moveTo(index + 1);
    else if (event.key === "ArrowLeft") moveTo(index - 1);
    else if (event.key === "Home") moveTo(0);
    else if (event.key === "End") moveTo(total - 1);
    else return;

    event.preventDefault();
  }

  return (
    <section
      aria-label={`${alt} 이미지`}
      aria-roledescription="캐러셀"
      className={cn("group relative aspect-square bg-paper-2", className)}
    >
      <div
        ref={scrollerRef}
        className={cn(
          "flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus",
          total > 1 && "cursor-grab select-none",
        )}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex={total > 1 ? 0 : -1}
        aria-label={total > 1 ? "사진 캐러셀, 좌우 방향키로 이동" : undefined}
      >
        {images.map((src, imageIndex) => {
          const shouldPreload = preloadFirstImage && imageIndex === 0;

          return (
            <div
              key={`${src.slice(0, 24)}-${imageIndex}`}
              role="group"
              aria-label={`${imageIndex + 1} / ${total}`}
              className="relative aspect-square min-w-full shrink-0 basis-full snap-start bg-paper-2"
            >
              <Image
                src={src}
                alt={`${alt} ${imageIndex + 1}번째 사진`}
                fill
                unoptimized={src.startsWith("data:")}
                draggable={false}
                preload={shouldPreload}
                loading={shouldPreload ? undefined : "lazy"}
                sizes="(max-width: 480px) 100dvw, 480px"
                className="pointer-events-none object-cover"
              />
            </div>
          );
        })}
      </div>

      {total > 1 ? (
        <>
          <p
            aria-live="polite"
            aria-atomic="true"
            className="pointer-events-none absolute top-3 right-3 z-10 rounded-full bg-ink/65 px-2 py-1 text-[11px] font-semibold text-paper tabular-nums"
          >
            {index + 1}/{total}
          </p>
          <button
            type="button"
            aria-label="이전 사진"
            disabled={index === 0}
            onClick={() => moveTo(index - 1)}
            className="absolute top-1/2 left-2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-ink shadow-card outline-none hover:bg-paper active:bg-paper-2 focus-visible:ring-2 focus-visible:ring-focus disabled:invisible [@media(pointer:fine)]:flex"
          >
            <ChevronLeft className="size-5" strokeWidth={1.9} />
          </button>
          <button
            type="button"
            aria-label="다음 사진"
            disabled={index === total - 1}
            onClick={() => moveTo(index + 1)}
            className="absolute top-1/2 right-2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-ink shadow-card outline-none hover:bg-paper active:bg-paper-2 focus-visible:ring-2 focus-visible:ring-focus disabled:invisible [@media(pointer:fine)]:flex"
          >
            <ChevronRight className="size-5" strokeWidth={1.9} />
          </button>
        </>
      ) : null}

      {currentPins.map((pin) => {
        const open = openPinId === pin.id;
        let notePosition = "left-1/2 -translate-x-1/2";
        if (pin.xPct < 25) notePosition = "-left-4";
        if (pin.xPct > 75) notePosition = "-right-4";
        const noteVerticalPosition =
          pin.yPct > 70 ? "bottom-1/2 mb-2" : "top-1/2 mt-2";
        return (
          <div
            key={pin.id}
            className="absolute z-10"
            style={{
              left: `clamp(26px, ${pin.xPct}%, calc(100% - 26px))`,
              top: `clamp(26px, ${pin.yPct}%, calc(100% - 26px))`,
            }}
          >
            <button
              type="button"
              aria-label={`핀 메모: ${pin.text}`}
              aria-expanded={open}
              aria-controls={`pin-note-${pin.id}`}
              className="press-overlay relative flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent-text text-paper shadow-float outline-none hover:bg-ink focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              onClick={(event) => {
                event.stopPropagation();
                setOpenPinId(open ? null : pin.id);
              }}
            >
              <Plus className="size-4" strokeWidth={1.9} />
            </button>
            {open ? (
              <p
                id={`pin-note-${pin.id}`}
                className={cn(
                  "absolute z-20 w-48 max-w-[calc(100dvw-2rem)] break-words rounded-xl bg-paper px-3 py-2 text-[12px] leading-[1.45] text-ink shadow-card [overflow-wrap:anywhere]",
                  notePosition,
                  noteVerticalPosition,
                )}
              >
                {pin.text}
              </p>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
