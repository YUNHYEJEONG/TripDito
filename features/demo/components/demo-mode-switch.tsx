"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/common/toast-alert";
import {
  DEMO_MODE_CHANGE_EVENT,
  isDemoMode,
  setDemoMode,
} from "@/features/demo/lib/demo-mode";
import { itemRepository } from "@/features/shopping-items/data/item-repository";
import { cn } from "@/lib/utils";

/** 헤더 — 지도 옆 PoC 데모 스위치 (쿠팡 비교 대기 5초) */
export function DemoModeSwitch() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isDemoMode());
    function onChange(event: Event) {
      const detail = (event as CustomEvent<{ enabled: boolean }>).detail;
      setEnabled(Boolean(detail?.enabled));
    }
    window.addEventListener(DEMO_MODE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(DEMO_MODE_CHANGE_EVENT, onChange);
  }, []);

  function toggle() {
    const next = !enabled;
    setDemoMode(next);
    setEnabled(next);
    if (next) {
      const accelerated = itemRepository.acceleratePendingCoupangCompare();
      toast.success(
        accelerated > 0
          ? `데모 ON · pending ${accelerated}건 즉시 비교`
          : "데모 ON · 쿠팡 비교 대기 5초",
      );
    } else {
      toast.message("데모 OFF · 쿠팡 비교 대기 1시간");
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="데모 모드"
      title={
        enabled
          ? "데모 ON — 쿠팡 비교 5초 후"
          : "데모 OFF — 쿠팡 비교 1시간 후"
      }
      onClick={toggle}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2 text-[11px] font-semibold transition-colors",
        enabled
          ? "border-primary bg-primary text-primary-foreground"
          : "border-[#CFD4DA] bg-background text-muted-foreground hover:bg-[#F2F4F6]",
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          enabled ? "bg-primary-foreground" : "bg-[#CFD4DA]",
        )}
        aria-hidden
      />
      데모
    </button>
  );
}
