"use client";

import { useEffect, type RefObject } from "react";

type MouseDragScrollOptions = {
  /** 캐러셀용 슬라이드 스냅 (기본 true) */
  snap?: boolean;
  /** 세로 휠을 가로 스크롤로 매핑 (필터 칩 바용) */
  wheel?: boolean;
};

/**
 * overflow 가로 영역에 마우스 드래그 스크롤을 추가합니다.
 * 터치/펜은 네이티브 스크롤을 그대로 사용합니다.
 *
 * 포인터 캡처는 threshold 이상 움직인 뒤에만 걸어,
 * 내부 버튼/칩 클릭이 가로채이지 않게 합니다.
 */
export function useMouseDragScroll(
  ref: RefObject<HTMLElement | null>,
  enabled = true,
  options: MouseDragScrollOptions = {},
) {
  const snap = options.snap ?? true;
  const wheel = options.wheel ?? false;

  useEffect(() => {
    if (!ref.current || !enabled) return;
    const el = ref.current;

    let dragging = false;
    let capturing = false;
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
      capturing = false;
      moved = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) <= threshold) return;

      if (!moved) {
        moved = true;
        el.dataset.dragMoved = "1";
        if (snap) {
          el.style.scrollSnapType = "none";
        }
        el.classList.add("cursor-grabbing");
        try {
          el.setPointerCapture(e.pointerId);
          capturing = true;
        } catch {
          /* capture unsupported */
        }
      }

      el.scrollLeft = startScroll - dx;
    }

    function onPointerUp(e: PointerEvent) {
      if (!dragging) return;
      dragging = false;
      if (snap) {
        el.style.scrollSnapType = "";
      }
      el.classList.remove("cursor-grabbing");
      if (capturing) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* already released */
        }
        capturing = false;
      }
      if (moved) {
        if (snap) snapToNearest();
        // click 핸들러가 드래그를 클릭으로 오인하지 않도록 한 틱 유지
        window.setTimeout(() => {
          delete el.dataset.dragMoved;
        }, 0);
      }
    }

    function onWheel(e: WheelEvent) {
      if (!wheel) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;

      const mostlyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
      const delta = mostlyVertical ? e.deltaY : e.deltaX;
      if (delta === 0) return;

      const next = Math.min(max, Math.max(0, el.scrollLeft + delta));
      if (next === el.scrollLeft) return;

      e.preventDefault();
      el.scrollLeft = next;
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    if (wheel) {
      el.addEventListener("wheel", onWheel, { passive: false });
    }

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [ref, enabled, snap, wheel]);
}
