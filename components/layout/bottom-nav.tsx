"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  Home,
  Plane,
  ShoppingBag,
  UserRound,
} from "lucide-react";
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
 * 오늘의집 스타일 하단 탭바
 * - 아이콘 24 + 라벨 10px
 * - 아이콘↔라벨 2px, 탭 높이 56 + safe area
 * - 활성: primary / 비활성: #848C94
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EAEDED] bg-background"
    >
      <div className="mx-auto flex h-14 max-w-[480px] items-stretch md:max-w-[720px] lg:max-w-[960px]">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 pb-1",
                "transition-colors",
                active ? "text-primary" : "text-[#848C94]",
              )}
            >
              <Icon
                className="size-6 shrink-0"
                strokeWidth={active ? 2.25 : 1.75}
                aria-hidden
              />
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
      <div className="h-[env(safe-area-inset-bottom)] bg-background" />
    </nav>
  );
}
