"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * 리스트 '+더보기' 공통
 * - 바로 위 구분선 없음
 * - primary(파란) 폰트
 */
const seeMoreClassName =
  "flex w-full items-center justify-center py-2.5 text-center text-[13px] font-semibold text-primary transition-colors active:bg-muted/40";

export function SeeMoreButton({
  children = "+더보기",
  className,
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(seeMoreClassName, className)}
    >
      {children}
    </button>
  );
}

export function SeeMoreLink({
  href,
  children = "+더보기",
  className,
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(seeMoreClassName, className)}>
      {children}
    </Link>
  );
}
