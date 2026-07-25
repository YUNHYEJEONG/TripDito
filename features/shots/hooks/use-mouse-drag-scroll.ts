"use client";

import { useEffect, type RefObject } from "react";

/**
 * overflow 캐러셀에 마우스 클릭-드래그로 이미지 전환을 추가합니다.
 * 터치/펜은 네이티브 스크롤을 그대로 사용합니다.
 */
export function useMouseDragScroll(
  ref: RefObject<HTMLElement | null>,
  enabled = true,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;
    const threshold = 4;

    function snapToNearest() {
      const slide = el.firstElementChild as HTMLElement | null;
      const width = slide?.getBoundingClientRect().width ?? el.clientWidth;
      if (!width) return;
      const index = Math.round(el.scrollLeft / width);
      el.scrollTo({ left: index * width, behavior: "smooth" });
    }

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.setPointerCapture(e.pointerId);
      el.style.scrollSnapType = "none";
      el.classList.add("cursor-grabbing");
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > threshold) {
        moved = true;
        el.dataset.dragMoved = "1";
      }
      el.scrollLeft = startScroll - dx;
    }

    function onPointerUp(e: PointerEvent) {
      if (!dragging) return;
      dragging = false;
      el.style.scrollSnapType = "";
      el.classList.remove("cursor-grabbing");
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      if (moved) {
        snapToNearest();
        // click 핸들러가 드래그를 클릭으로 오인하지 않도록 한 프레임 유지
        window.setTimeout(() => {
          delete el.dataset.dragMoved;
        }, 0);
      }
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [ref, enabled]);
}
