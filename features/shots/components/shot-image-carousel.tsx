"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImagePin } from "../schema";
import { useMouseDragScroll } from "../hooks/use-mouse-drag-scroll";

/**
 * 슬라이드 한 장. load 가 한 번 true 가 되면 img 를 계속 붙여 둔다.
 * 받는 동안은 회색 배경만 보이고, 다 받으면 살짝 페이드인.
 */
function Slide({
  src,
  load,
  priority,
}: {
  src: string;
  load: boolean;
  priority: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative aspect-square min-w-full shrink-0 basis-full snap-start bg-[#F2F4F6]">
      {load ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          // 캐시에 있던 이미지는 onLoad 가 붙기 전에 끝날 수 있으므로 complete 도 본다
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0) setLoaded(true);
          }}
          src={src}
          alt=""
          // 가로 스크롤 안의 슬라이드는 브라우저 lazy 판정에 걸리므로 로딩 시점은 직접 정한다
          loading="eager"
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          className={cn(
            "pointer-events-none size-full object-cover transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0",
          )}
          draggable={false}
        />
      ) : null}
    </div>
  );
}

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
  active = true,
  priority = false,
}: {
  images: string[];
  pins?: ImagePin[];
  className?: string;
  /**
   * 이미지를 받기 시작할지. 피드에서는 카드가 화면 근처에 오면 true 로 바꿔
   * 사용자가 내려오기 전에 미리 받아 둔다. 첫 장과 그 다음 장까지 받고,
   * 넘길 때마다 다음 장을 이어서 받는다.
   */
  active?: boolean;
  /** 첫 화면에 보이는 카드 — 첫 장을 최우선으로 받는다 */
  priority?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  // index: 지금 보는 장 / reached: 지금까지 넘겨 본 가장 먼 장 (받기 시작한 슬라이드를 계속 붙여 두기 위해)
  const [nav, setNav] = useState({ index: 0, reached: 0 });
  const [openPinId, setOpenPinId] = useState<string | null>(null);
  const index = nav.index;

  const total = images.length;
  const currentPins = pins.filter((pin) => pin.imageIndex === index);

  function moveTo(next: number) {
    setNav((prev) =>
      prev.index === next
        ? prev
        : { index: next, reached: Math.max(prev.reached, next) },
    );
  }

  /** 지금 보는 장과 바로 다음 장까지 미리 받아 둔다. active 와 reached 는 되돌아가지 않는다 */
  function shouldLoad(i: number) {
    return active && i <= nav.reached + 1;
  }

  useMouseDragScroll(scrollerRef, total > 1);

  useEffect(() => {
    setNav({ index: 0, reached: 0 });
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [images]);

  useEffect(() => {
    setOpenPinId(null);
  }, [index]);

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
        moveTo(next);
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
    moveTo(next);
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
          <Slide
            key={`${src.slice(0, 24)}-${i}`}
            src={src}
            load={shouldLoad(i)}
            priority={priority && i === 0}
          />
        ))}
      </div>

      {total > 1 ? (
        <span className="pointer-events-none absolute top-3 right-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white tabular-nums">
          {index + 1}/{total}
        </span>
      ) : null}

      {currentPins.map((pin) => {
        const open = openPinId === pin.id;
        return (
          <div
            key={pin.id}
            className="absolute z-10"
            style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%` }}
          >
            <button
              type="button"
              aria-label="핀 코멘트"
              className="-translate-x-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-primary text-white shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                setOpenPinId(open ? null : pin.id);
              }}
            >
              <Plus className="size-4" strokeWidth={2.5} />
            </button>
            {open ? (
              <div className="absolute top-1/2 left-1/2 z-20 mt-1 w-48 -translate-x-1/2 rounded-xl bg-white px-3 py-2 text-[12px] leading-snug text-foreground shadow-lg">
                {pin.itemId ? (
                  /* 쇼핑리스트 아이템과 연결된 핀 — 실제 산 물건 표시 */
                  <span className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-primary">
                    <ShoppingBag className="size-3" aria-hidden />
                    쇼핑리스트 아이템
                  </span>
                ) : null}
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
