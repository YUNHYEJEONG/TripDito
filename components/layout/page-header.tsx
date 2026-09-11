import Link from "next/link";
import type { ComponentProps } from "react";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";

/** 헤더 아이콘 버튼 — 타이틀·취소와 같은 36px 밴드에 세로 가운데, 원형 */
export const headerIconButtonClassName = cn(
  buttonVariants({ variant: "ghost", size: "icon-sm" }),
  "size-9 shrink-0 rounded-full text-foreground/80 hover:bg-secondary hover:text-foreground active:translate-y-0 active:bg-secondary [&_svg:not([class*='size-'])]:size-5",
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

/**
 * 공통 페이지 헤더
 * - 딱딱한 1px 보더 대신 가운데가 진한 그라데이션 헤어라인 + 은은한 블러
 * - 화면명 앞에 브랜드 그라데이션 마커(3×16)로 포인트
 * - 우측 액션은 원형 아이콘 버튼
 */
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
        "relative z-20 -mx-4 mb-3 flex h-12 items-center gap-1.5 bg-canvas/85 px-4 backdrop-blur-xl sm:-mx-5 sm:px-5 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8",
        "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-border after:to-transparent",
        sticky && "sticky top-0",
        className,
      )}
    >
      {backHref ? (
        <Link
          href={backHref}
          aria-label="뒤로"
          className={cn(headerIconButtonClassName, "-ml-1.5")}
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
        <div className="flex min-w-0 flex-1 items-center gap-2 self-stretch">
          {!backHref ? (
            <span
              aria-hidden
              className="h-4 w-[3px] shrink-0 rounded-full bg-[linear-gradient(180deg,#62CBFF_0%,#3182F6_100%)]"
            />
          ) : null}
          <div
            className={cn(
              "flex min-w-0 flex-col justify-center",
              description ? "gap-0.5 py-0.5" : "h-9",
            )}
          >
            <h1 className="truncate text-left text-[17px] font-bold leading-none tracking-[-0.01em] text-foreground">
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
        <div className="-mr-1.5 flex h-9 shrink-0 items-center gap-0.5">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
