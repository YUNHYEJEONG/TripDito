import Link from "next/link";
import type { ComponentProps } from "react";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";

/** 헤더 아이콘 버튼 — 타이틀·취소와 같은 36px 밴드에 세로 가운데 */
export const headerIconButtonClassName = cn(
  buttonVariants({ variant: "ghost", size: "icon-sm" }),
  "size-9 shrink-0 active:translate-y-0 [&_svg:not([class*='size-'])]:size-5",
);

/** 헤더 '취소' — 타이틀(16px)보다 작은 13px, 회색→클릭 시 블랙, 볼드 없음 */
export const headerCancelClassName =
  "inline-flex h-9 shrink-0 items-center justify-center px-1.5 text-[13px] font-normal leading-none text-[#848C94] transition-colors hover:bg-transparent hover:text-foreground active:translate-y-0 active:bg-transparent active:text-foreground";

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
        "z-20 -mx-4 mb-3 flex h-12 items-center gap-1.5 border-b border-border bg-canvas/95 px-4 backdrop-blur-md sm:-mx-5 sm:px-5 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8",
        sticky && "sticky top-0",
        className,
      )}
    >
      {backHref ? (
        <Link
          href={backHref}
          aria-label="뒤로"
          className={headerIconButtonClassName}
        >
          <ArrowLeft />
        </Link>
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
              description ? "gap-0.5 py-0.5" : "h-9",
            )}
          >
            <h1 className="truncate text-left text-base font-semibold leading-none tracking-tight text-foreground">
              {title}
            </h1>
            {description ? (
              <p className="truncate text-left text-xs leading-none text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {actions ? (
        <div className="flex h-9 shrink-0 items-center gap-0.5">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
