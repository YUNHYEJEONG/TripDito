import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 입력란 + 물리(액션) 버튼 가로 조합.
 * - 세로 중앙 정렬
 * - 자식 Input/Button은 각각 h-10 + rounded-lg (designSystem.radius.control)
 */
export function FieldActionRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>{children}</div>
  );
}
