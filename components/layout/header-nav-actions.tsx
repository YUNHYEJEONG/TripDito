"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Bell, MapPinned } from "lucide-react";
import { headerIconButtonClassName } from "@/components/layout/page-header";
import { useUnreadNotificationCount } from "@/features/notifications/hooks/use-notifications";
import { withReturnTo } from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";

/** 현재 화면으로 돌아올 수 있는 지도·알림 액션을 한곳에서 제공한다. */
export function HeaderNavActions() {
  return (
    <Suspense fallback={<HeaderLinks returnTo="/home" />}>
      <CurrentPageHeaderLinks />
    </Suspense>
  );
}

function CurrentPageHeaderLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hash, setHash] = useState("");
  const search = searchParams.toString();

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const returnTo = `${pathname}${search ? `?${search}` : ""}${hash}`;

  return <HeaderLinks returnTo={returnTo} />;
}

function HeaderLinks({ returnTo }: { returnTo: string }) {
  const { data: unread = 0 } = useUnreadNotificationCount();

  return (
    <div className="flex items-center gap-1">
      <Link
        href={withReturnTo("/map", returnTo)}
        aria-label="지도 열기"
        className={headerIconButtonClassName}
      >
        <MapPinned />
      </Link>
      <Link
        href={withReturnTo("/notifications", returnTo)}
        aria-label={unread > 0 ? `알림 ${unread}개 읽지 않음` : "알림 열기"}
        className={cn(headerIconButtonClassName, "relative")}
      >
        <Bell />
        {unread > 0 ? (
          <span
            className="absolute top-2 right-2 size-2 rounded-full border-2 border-paper bg-danger"
            aria-hidden
          />
        ) : null}
      </Link>
    </div>
  );
}
