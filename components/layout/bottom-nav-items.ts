export const BOTTOM_NAV_ITEMS = [
  { id: "shopping", href: "/shopping", ariaLabel: "쇼핑" },
  { id: "shots", href: "/shots", ariaLabel: "때샷" },
  { id: "home", href: "/home", ariaLabel: "홈" },
  { id: "passport", href: "/passport", ariaLabel: "여권" },
  { id: "profile", href: "/profile", ariaLabel: "프로필" },
] as const;

export type BottomNavItemId = (typeof BOTTOM_NAV_ITEMS)[number]["id"];

function isRouteOrChild(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

/**
 * 여행 목록 관리는 여권 허브에, 쇼핑리스트 작업은 홈 흐름에 둔다.
 */
export function getActiveBottomNavItem(
  pathname: string,
): BottomNavItemId | null {
  if (isRouteOrChild(pathname, "/shopping")) return "shopping";
  if (isRouteOrChild(pathname, "/shots")) return "shots";
  if (
    pathname === "/passport" ||
    isRouteOrChild(pathname, "/my-trips")
  ) {
    return "passport";
  }
  if (isRouteOrChild(pathname, "/profile")) return "profile";
  if (
    pathname === "/" ||
    isRouteOrChild(pathname, "/home") ||
    isRouteOrChild(pathname, "/trips")
  ) {
    return "home";
  }

  return null;
}
