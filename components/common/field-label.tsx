"use client";

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
}: {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <Label className={cn("gap-0.5", className)}>
      <span>{children}</span>
      {required ? (
        <span className="text-destructive" aria-hidden>
          *
        </span>
      ) : null}
    </Label>
  );
}
