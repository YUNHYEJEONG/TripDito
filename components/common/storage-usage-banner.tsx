"use client";

import { useEffect, useState } from "react";
import { getStorageUsage, type StorageUsage } from "@/lib/storage/usage";
import { cn } from "@/lib/utils";

export function StorageUsageBanner({ className }: { className?: string }) {
  const [usage, setUsage] = useState<StorageUsage | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setUsage(getStorageUsage());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!usage || usage.level === "ok") return null;

  return (
    <div
      role="status"
      className={cn(
        "rounded-xl border px-4 py-3 text-[13px] leading-5 text-ink",
        usage.level === "danger"
          ? "border-danger bg-destructive/10"
          : "border-border bg-warning/15",
        className,
      )}
    >
      로컬 저장 공간을 {usage.usedLabel} 사용 중이에요. 이미지가 많아지면 일부
      내용이 저장되지 않을 수 있어요. 필요 없는 상품이나 사진을 정리해 주세요.
    </div>
  );
}
