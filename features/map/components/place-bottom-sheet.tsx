"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Snap = "half" | "full";

/**
 * 구글 지도 스타일 장소 상세 바텀시트
 * - 열릴 때 절반(half) → 드래그/스크롤로 전체(full)
 * - 가로 풀폭, 상단 라운드 + grabber
 */
export function PlaceBottomSheet({
  open,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [snap, setSnap] = useState<Snap>("half");
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragStartSnap = useRef<Snap>("half");
  const handleWasDragged = useRef(false);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => closeButtonRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSnap("half");
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  const closeSheet = useCallback(() => {
    setSnap("half");
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    onClose();
  }, [onClose]);

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragStartY.current = e.clientY;
      dragStartSnap.current = snap;
      handleWasDragged.current = false;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [snap],
  );

  const onHandlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragStartY.current == null) return;
      const dy = e.clientY - dragStartY.current;
      dragStartY.current = null;
      handleWasDragged.current = Math.abs(dy) > 8;

      if (dy < -48) {
        setSnap("full");
        return;
      }
      if (dy > 48) {
        if (dragStartSnap.current === "full") setSnap("half");
        else closeSheet();
      }
    },
    [closeSheet],
  );

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !open) return;
    if (snap === "half" && el.scrollTop > 8) {
      setSnap("full");
    }
  }, [open, snap]);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!open) return;
      const el = scrollRef.current;
      if (snap === "half" && e.deltaY > 0) {
        setSnap("full");
        return;
      }
      if (snap === "full" && e.deltaY < 0 && el && el.scrollTop <= 0) {
        setSnap("half");
      }
    },
    [open, snap],
  );

  return (
    <div
      ref={sheetRef}
      role="dialog"
      aria-modal="false"
      aria-label="장소 정보"
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "absolute inset-x-0 bottom-0 z-30 flex w-full max-w-none flex-col bg-background shadow-float",
        "rounded-t-2xl transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)]",
        "touch-pan-y",
        open ? "translate-y-0" : "pointer-events-none translate-y-[110%]",
        snap === "full" ? "top-3 h-auto" : "top-auto h-[52%]",
      )}
      style={{ colorScheme: "only light" }}
      onWheel={onWheel}
      onTransitionEnd={(event) => {
        if (event.target !== sheetRef.current || open) return;
        setSnap("half");
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      }}
    >
      <div className="relative flex min-h-12 shrink-0 items-center justify-center">
        <button
          type="button"
          aria-label={snap === "half" ? "장소 정보 펼치기" : "장소 정보 접기"}
          className="flex h-11 w-16 cursor-grab touch-none items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus active:cursor-grabbing"
          onClick={() => {
            if (handleWasDragged.current) {
              handleWasDragged.current = false;
              return;
            }
            setSnap((current) => (current === "half" ? "full" : "half"));
          }}
          onPointerDown={onHandlePointerDown}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={() => {
            dragStartY.current = null;
            handleWasDragged.current = false;
          }}
        >
          <span className="h-1 w-10 rounded-full bg-paper-3" aria-hidden />
        </button>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="장소 정보 닫기"
          className="absolute top-1 right-2 z-20 flex size-11 items-center justify-center rounded-full bg-secondary text-foreground transition-colors duration-[var(--dur-fast)] hover:bg-paper-3 active:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          onClick={(e) => {
            e.stopPropagation();
            closeSheet();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <X className="size-5" strokeWidth={1.8} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain px-0"
        onScroll={onScroll}
      >
        {children}
      </div>
      {footer ? (
        <div className="shrink-0 border-t border-rule bg-paper px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
