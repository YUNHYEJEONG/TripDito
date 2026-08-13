import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 입력란 + 액션 버튼 가로 조합.
 * - 세로 중앙 정렬
 * - 자식 Input/Button은 각각 44px(h-11) + 12px(rounded-lg)
 * - DESIGN.md v5.7의 최소 타깃과 컨트롤 라운드를 공유
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
