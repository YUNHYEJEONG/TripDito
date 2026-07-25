import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * 회색 서피스 카드 (토스/오늘의집형)
 * - 기존 Card(흰 배경)를 대체하지 않는 추가 에셋
 * - 서비스 설명, 안내, 요약 영역에 사용
 */
function GrayCard({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="gray-card"
      data-size={size}
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl bg-surface-gray text-surface-gray-foreground",
        size === "default" && "gap-2.5 p-4",
        size === "sm" && "gap-1.5 p-3",
        className,
      )}
      {...props}
    />
  );
}

function GrayCardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="gray-card-title"
      className={cn(
        "font-heading text-[15px] font-semibold leading-snug tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function GrayCardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="gray-card-description"
      className={cn(
        "text-[13px] leading-relaxed text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { GrayCard, GrayCardTitle, GrayCardDescription };
