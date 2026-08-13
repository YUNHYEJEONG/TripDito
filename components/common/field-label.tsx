"use client";

import type { ComponentProps } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * 폼 필드 라벨 공통
 * - 필수(*)는 라벨 텍스트 바로 옆 (좁은 간격)
 */
export function FieldLabel({
  children,
  required,
  className,
  ...props
}: ComponentProps<typeof Label> & {
  required?: boolean;
}) {
  return (
    <Label className={cn("gap-1", className)} {...props}>
      <span>{children}</span>
      {required ? (
        <>
          <span className="text-ink" aria-hidden>
            *
          </span>
          <span className="sr-only"> (필수)</span>
        </>
      ) : null}
    </Label>
  );
}
