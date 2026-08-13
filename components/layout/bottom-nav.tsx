"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Images, ShoppingBag, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/home",
    label: "홈",
    icon: Home,
    active: (pathname: string) =>
      pathname === "/home" ||
      pathname === "/" ||
      pathname.startsWith("/my-trips") ||
      pathname.startsWith("/trips"),
  },
  {
    href: "/shopping",
    label: "쇼핑",
    icon: ShoppingBag,
    active: (pathname: string) => pathname.startsWith("/shopping"),
  },
  {
    href: "/shots",
    label: "때샷",
    icon: Images,
    active: (pathname: string) => pathname.startsWith("/shots"),
  },
  {
    href: "/profile",
    label: "프로필",
    icon: UserRound,
    active: (pathname: string) => pathname.startsWith("/profile"),
  },
] as const;

/**
 * 앱이 모바일 전용이므로 넓은 화면에서도 중앙 앱 레일의 하단 탭을 유지한다.
 * 여행 관리는 홈의 현재 여행 영역에 포함하고, 전역 목적지만 4개로 유지한다.
 */
export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/map" || pathname.startsWith("/map/")) return null;

  return (
    <nav
      aria-label="주요 메뉴"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
    >
      <div className="pointer-events-auto mx-auto max-w-[var(--app-rail-max)] border-t border-rule bg-paper min-[481px]:border-x">
        <div className="grid h-[var(--tab-bar-height)] grid-cols-4 items-stretch px-2">
          {tabs.map(({ href, label, icon: Icon, active: isActive }) => {
            const active = isActive(pathname);

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-0.5 whitespace-nowrap outline-none transition-[color,background-color,transform] duration-120 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus active:scale-[0.98]",
                  active
                    ? "text-accent-text active:bg-paper-2"
                    : "text-ink-2 hover:bg-paper-2 hover:text-ink active:bg-paper-2 active:text-ink",
                )}
              >
                <Icon
                  className="size-[22px] shrink-0"
                  strokeWidth={active ? 2.35 : 1.85}
                  aria-hidden
                />
                <span
                  className={cn(
                    "text-[10px] leading-none tracking-[-0.01em] min-[360px]:text-[11px]",
                    active ? "font-bold" : "font-medium",
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)] bg-paper" />
      </div>
    </nav>
  );
}
