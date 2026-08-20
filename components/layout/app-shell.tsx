import { cn } from "@/lib/utils";

export type AppShellSurface = "compact" | "feed" | "planning" | "passport";

/**
 * 모든 viewport에서 480px 모바일 앱 레일을 유지하는 공통 화면 셸.
 * `passport`만 700px 이상 900px 미만 폴더블 구간에서 두 물리 페이지를 위해 확장한다.
 * 그 외 화면과 900px 이상 데스크톱에서는 480px 모바일 앱 레일을 유지한다.
 */
export function AppShell({
  children,
  className,
  withBottomNav = false,
  mode,
  surface = "compact",
}: {
  children: React.ReactNode;
  className?: string;
  /** 하단 탭바 + safe area 여유 패딩 */
  withBottomNav?: boolean;
  /** 홈 전용 여행 단계. 다른 화면에는 전달하지 않는다. */
  mode?: "idle" | "prep" | "live" | "after";
  /** 기존 호출부 호환용 화면 성격 표식 */
  surface?: AppShellSurface;
}) {
  const contextualMode = mode && mode !== "idle";

  return (
    <div
      data-mode={contextualMode ? mode : undefined}
      data-surface={surface}
      className={cn(
        "app-rail mx-auto flex min-h-dvh w-full max-w-[var(--app-rail-max)] flex-1 flex-col bg-paper px-[var(--app-gutter)] pt-[calc(env(safe-area-inset-top)+0.75rem)]",
        surface === "passport" &&
          "min-[700px]:max-[900px]:max-w-[calc(100vw-2rem)]",
        withBottomNav
          ? "pb-[calc(var(--tab-bar-height)+var(--app-bottom-gap)+env(safe-area-inset-bottom))]"
          : "pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
        className,
      )}
    >
      {children}
    </div>
  );
}
