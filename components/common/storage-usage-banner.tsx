"use client";

import { useEffect, useState } from "react";
import { getStorageUsage, type StorageUsage } from "@/lib/storage/usage";
import { cn } from "@/lib/utils";

export function StorageUsageBanner({ className }: { className?: string }) {
  const [usage, setUsage] = useState<StorageUsage | null>(null);

  useEffect(() => {
    setUsage(getStorageUsage());
  }, []);

  if (!usage || usage.level === "ok") return null;

  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3 text-sm",
        usage.level === "danger"
          ? "bg-destructive/10 text-destructive"
          : "bg-warning/15 text-foreground",
        className,
      )}
    >
      로컬 저장 용량이 {usage.usedLabel}입니다. 이미지가 많으면 일부 데이터가
      저장되지 않을 수 있어요. 불필요한 상품을 정리해 주세요.
    </div>
  );
}
