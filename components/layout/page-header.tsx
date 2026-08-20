import type { ComponentProps } from "react";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SafeBackLink } from "@/components/common/safe-back-link";
import { cn } from "@/lib/utils";

/** 헤더 아이콘 버튼 — 44px 터치 타깃 */
export const headerIconButtonClassName = cn(
  buttonVariants({ variant: "ghost", size: "icon-sm" }),
  "size-11 shrink-0 [&_svg:not([class*='size-'])]:size-5",
);

/** 헤더 '취소' — 타이틀보다 작은 13px 보조 액션 */
export const headerCancelClassName =
  "inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-2 text-[13px] font-medium leading-none text-ink-2 transition-colors duration-120 hover:bg-paper-2 hover:text-foreground active:bg-paper-3 active:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

export function HeaderCancelButton({
  children = "취소",
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(headerCancelClassName, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function PageHeader({
  title,
  titleAccessory,
  description,
  backHref,
  actions,
  className,
  /** 홈: 심볼+로고. 그 외 화면은 title(화면명)만 좌측 정렬 */
  brand = false,
  /** 상단 고정 (기본 true). false면 스크롤과 함께 이동 */
  sticky = true,
}: {
  title: string;
  titleAccessory?: React.ReactNode;
  description?: string;
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
  brand?: boolean;
  sticky?: boolean;
}) {
  return (
    <header
      className={cn(
        "z-20 -mx-[var(--app-gutter)] -mt-3 mb-4 flex h-[var(--app-bar-height)] items-center gap-2 border-b border-rule bg-paper px-[var(--app-gutter)]",
        sticky &&
          "sticky top-[env(safe-area-inset-top)] before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-[env(safe-area-inset-top)] before:bg-paper",
        className,
      )}
    >
      {backHref ? (
        <SafeBackLink
          href={backHref}
          aria-label="뒤로"
          className={headerIconButtonClassName}
        >
          <ArrowLeft />
        </SafeBackLink>
      ) : null}

      {brand ? (
        <div className="flex h-9 min-w-0 flex-1 items-center">
          <BrandLogo variant="full" size="md" href="/home" />
          {description ? (
            <p className="ml-2 truncate text-xs leading-none text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 items-center self-stretch">
          <div
            className={cn(
              "flex min-w-0 flex-col justify-center",
              description ? "gap-1" : "h-9",
            )}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <h1 className="min-w-0 flex-1 truncate text-left text-[18px] font-semibold leading-none tracking-[-0.02em] text-foreground">
                {title}
              </h1>
              {titleAccessory ? (
                <div className="shrink-0">{titleAccessory}</div>
              ) : null}
            </div>
            {description ? (
              <p className="truncate text-left text-xs leading-none text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {actions ? (
        <div className="flex h-11 shrink-0 items-center gap-1">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
