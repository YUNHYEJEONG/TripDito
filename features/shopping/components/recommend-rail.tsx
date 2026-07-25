"use client";

import { useRef } from "react";
import type { ShoppingRecommendItem } from "../data/demo-shopping-content";
import { cn } from "@/lib/utils";

function RecommendCard({
  item,
  dragSafe,
}: {
  item: ShoppingRecommendItem;
  dragSafe: React.MutableRefObject<boolean>;
}) {
  const body = (
    <>
      <div
        className={cn(
          "relative aspect-[4/5] w-full overflow-hidden rounded-xl",
          item.tone,
        )}
      >
        {item.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageSrc}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full object-cover"
          />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-2.5 pb-2.5 pt-8">
          <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-white">
            {item.title}
          </p>
        </div>
      </div>
      <p className="mt-1.5 truncate text-[12px] font-medium text-foreground">
        {item.subtitle}
      </p>
      <p className="truncate text-[11px] text-muted-foreground">{item.spot}</p>
    </>
  );

  if (item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        draggable={false}
        className="block w-full text-left outline-none"
        onClick={(event) => {
          if (dragSafe.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {body}
      </a>
    );
  }

  return <div className="block w-full text-left">{body}</div>;
}

export function RecommendRail({
  items,
  ariaLabel,
}: {
  items: ShoppingRecommendItem[];
  ariaLabel: string;
}) {
  const railRef = useRef<HTMLUListElement>(null);
  const dragSafe = useRef(false);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startScrollLeft: number;
    moved: boolean;
  } | null>(null);

  function onPointerDown(event: React.PointerEvent<HTMLUListElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const rail = railRef.current;
    if (!rail) return;

    dragSafe.current = false;
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: rail.scrollLeft,
      moved: false,
    };
    rail.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLUListElement>) {
    const rail = railRef.current;
    const state = dragState.current;
    if (!rail || !state || state.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - state.startX;
    if (!state.moved && Math.abs(deltaX) > 6) {
      state.moved = true;
      dragSafe.current = true;
      rail.dataset.dragging = "true";
    }
    if (!state.moved) return;

    rail.scrollLeft = state.startScrollLeft - deltaX;
    event.preventDefault();
  }

  function endDrag(event: React.PointerEvent<HTMLUListElement>) {
    const rail = railRef.current;
    const state = dragState.current;
    if (!state || state.pointerId !== event.pointerId) return;

    dragState.current = null;
    if (rail?.hasPointerCapture(event.pointerId)) {
      rail.releasePointerCapture(event.pointerId);
    }
    if (rail) delete rail.dataset.dragging;

    // 클릭 직전에 dragSafe를 잠깐 유지해 링크 이동을 막음
    if (state.moved) {
      window.setTimeout(() => {
        dragSafe.current = false;
      }, 0);
    }
  }

  function onWheel(event: React.WheelEvent<HTMLUListElement>) {
    const rail = railRef.current;
    if (!rail) return;

    const dominantDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
    if (dominantDelta === 0) return;

    const maxScroll = rail.scrollWidth - rail.clientWidth;
    if (maxScroll <= 0) return;

    const next = rail.scrollLeft + dominantDelta;
    const clamped = Math.max(0, Math.min(maxScroll, next));
    if (clamped === rail.scrollLeft) return;

    rail.scrollLeft = clamped;
    event.preventDefault();
  }

  return (
    <ul
      ref={railRef}
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={onWheel}
      className={cn(
        "-mx-4 flex cursor-grab gap-2.5 overflow-x-auto px-4 pb-1",
        "touch-pan-x select-none",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "data-[dragging=true]:cursor-grabbing",
      )}
    >
      {items.map((item) => (
        <li key={item.id} className="w-[148px] shrink-0">
          <RecommendCard item={item} dragSafe={dragSafe} />
        </li>
      ))}
    </ul>
  );
}
