import { cn } from "@/lib/utils";
import { designSystem } from "@/config/design-system";

/**
 * 세로 카드/섹션 스택 — 홈 등 요약 대문 공통 간격
 * @see designSystem.layout.cardStackGap
 */
export function CardStack({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-layout="card-stack"
      className={cn(
        "flex flex-col",
        designSystem.layout.cardStackGapClass,
        className,
      )}
    >
      {children}
    </div>
  );
}
