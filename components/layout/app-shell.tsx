import { cn } from "@/lib/utils";

/**
 * 반응형 셸
 * - 최소 320px
 * - 모바일 ~767 / 태블릿 768~1023 / 데스크톱 1024+
 * - 콘텐츠 최대폭: 모바일 480 · 태블릿 720 · 데스크톱 960
 */
export function AppShell({
  children,
  className,
  withBottomNav = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** 하단 탭바(56px) + safe area 여유 패딩 */
  withBottomNav?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-full w-full min-w-[320px] max-w-[480px] flex-1 flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 md:max-w-[720px] md:px-6 lg:max-w-[960px] lg:px-8",
        withBottomNav
          ? "pb-[calc(3.5rem+1.25rem+env(safe-area-inset-bottom))]"
          : "pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
        className,
      )}
    >
      {children}
    </div>
  );
}
