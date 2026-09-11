"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Home, Plane, ShoppingBag, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/shopping",
    label: "쇼핑",
    icon: ShoppingBag,
  },
  {
    href: "/shots",
    label: "때샷구경",
    icon: Camera,
  },
  {
    href: "/home",
    label: "홈",
    icon: Home,
  },
  {
    href: "/my-trips",
    label: "내여행",
    icon: Plane,
  },
  {
    href: "/profile",
    label: "프로필",
    icon: UserRound,
  },
] as const;

/**
 * 하단 탭바 — 바닥에 붙이고 윗모서리만 둥글게
 * - 아이콘 22 + 라벨 10px, 활성 탭은 소프트 블루 캡슐 배경
 * - 높이 56 + safe area (AppShell.withBottomNav 패딩과 맞춤)
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="하단 메뉴"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 rounded-t-[22px] border-t border-border/70 bg-background/95 backdrop-blur-xl",
        "shadow-[0_-6px_24px_-12px_rgba(25,31,40,0.18)] dark:shadow-[0_-6px_24px_-12px_rgba(0,0,0,0.6)]",
      )}
    >
      <div className="mx-auto flex h-14 max-w-[480px] items-stretch px-1.5 md:max-w-[720px] lg:max-w-[960px]">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl pt-1 pb-1",
                "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                active
                  ? "text-primary"
                  : "text-[#848C94] hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-11 items-center justify-center rounded-full transition-all duration-200",
                  active
                    ? "bg-brand-soft dark:bg-primary/15"
                    : "bg-transparent group-active:bg-secondary",
                )}
              >
                <Icon
                  className="size-[22px] shrink-0"
                  strokeWidth={active ? 2.25 : 1.75}
                  aria-hidden
                />
              </span>
              <span
                className={cn(
                  "text-[10px] leading-none tracking-tight",
                  active ? "font-semibold" : "font-medium",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
