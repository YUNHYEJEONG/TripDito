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
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [snap, setSnap] = useState<Snap>("half");
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragStartSnap = useRef<Snap>("half");

  useEffect(() => {
    if (open) {
      setSnap("half");
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [open]);

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragStartY.current = e.clientY;
      dragStartSnap.current = snap;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [snap],
  );

  const onHandlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragStartY.current == null) return;
      const dy = e.clientY - dragStartY.current;
      dragStartY.current = null;

      if (dy < -48) {
        setSnap("full");
        return;
      }
      if (dy > 48) {
        if (dragStartSnap.current === "full") setSnap("half");
        else onClose();
      }
    },
    [onClose],
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
      if (
        snap === "full" &&
        e.deltaY < 0 &&
        el &&
        el.scrollTop <= 0
      ) {
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
      aria-hidden={!open}
      className={cn(
        "absolute inset-x-0 bottom-0 z-30 flex w-full max-w-none flex-col bg-white shadow-[0_-8px_28px_rgba(0,0,0,0.18)]",
        "rounded-t-[1.25rem] transition-[height,top,transform] duration-300 ease-out",
        "touch-pan-y",
        open ? "translate-y-0" : "pointer-events-none translate-y-[110%]",
        // full: 헤더와 시트 사이 소폭 여유 / half: 절반
        snap === "full" ? "top-3 h-auto" : "top-auto h-[52%]",
      )}
      style={{ colorScheme: "only light" }}
      onWheel={onWheel}
    >
      {/* grabber + close */}
      <div
        className="relative flex shrink-0 cursor-grab touch-none flex-col items-center active:cursor-grabbing"
        onPointerDown={onHandlePointerDown}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={() => {
          dragStartY.current = null;
        }}
      >
        <div className="flex w-full items-center justify-center pt-2.5 pb-1">
          <div className="h-1 w-10 rounded-full bg-[#DADCE0]" aria-hidden />
        </div>
        <button
          type="button"
          aria-label="닫기"
          className="absolute top-2 right-3 z-20 flex size-9 items-center justify-center rounded-full bg-[#F1F3F4] text-[#3C4043] transition-colors hover:bg-[#E8EAED]"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <X className="size-4" strokeWidth={2.25} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain px-0"
        onScroll={onScroll}
      >
        {children}
      </div>
    </div>
  );
}
