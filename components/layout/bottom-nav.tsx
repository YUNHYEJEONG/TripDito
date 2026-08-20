"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Images, ShoppingBag, UserRound } from "lucide-react";
import {
  BOTTOM_NAV_ITEMS,
  getActiveBottomNavItem,
  type BottomNavItemId,
} from "@/components/layout/bottom-nav-items";
import { cn } from "@/lib/utils";

const tabIcons = {
  shopping: ShoppingBag,
  shots: Images,
  home: Home,
  passport: BookOpen,
  profile: UserRound,
} satisfies Record<BottomNavItemId, typeof Home>;

/**
 * 앱이 모바일 전용이므로 넓은 화면에서도 중앙 앱 레일의 하단 탭을 유지한다.
 * 홈을 엄지 도달이 쉬운 중앙에 두고, 완료 여행은 독립된 여권 탭에서 본다.
 */
export function BottomNav() {
  const pathname = usePathname();
  const activeItem = getActiveBottomNavItem(pathname);

  if (pathname === "/map" || pathname.startsWith("/map/")) return null;

  return (
    <nav
      aria-label="주요 메뉴"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
    >
      <div
        data-bottom-nav-rail=""
        className="pointer-events-auto mx-auto w-full max-w-[var(--app-rail-max)] border-t border-rule bg-paper min-[481px]:border-x"
      >
        <div className="grid h-[var(--tab-bar-height)] grid-cols-5 items-stretch px-2">
          {BOTTOM_NAV_ITEMS.map(({ id, href, ariaLabel }) => {
            const Icon = tabIcons[id];
            const active = activeItem === id;

            return (
              <Link
                key={id}
                href={href}
                aria-label={ariaLabel}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 min-w-11 items-center justify-center rounded-2xl outline-none transition-[color,background-color,transform] duration-120 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus active:scale-[0.96]",
                  active
                    ? "bg-accent/10 text-accent-text active:bg-accent/15"
                    : "text-ink-2 hover:bg-paper-2 hover:text-ink active:bg-paper-2 active:text-ink",
                )}
              >
                <Icon
                  className={cn(
                    "shrink-0 transition-[transform,stroke-width] duration-120",
                    active ? "size-7 scale-105" : "size-6",
                  )}
                  strokeWidth={active ? 2.4 : 1.8}
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)] bg-paper" />
      </div>
    </nav>
  );
}
