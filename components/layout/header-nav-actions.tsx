"use client";

import Link from "next/link";
import { Bell, MapPinned } from "lucide-react";
import { headerIconButtonClassName } from "@/components/layout/page-header";
import { DemoModeSwitch } from "@/features/demo/components/demo-mode-switch";
import { useUnreadNotificationCount } from "@/features/notifications/hooks/use-notifications";
import { cn } from "@/lib/utils";

export function HeaderNavActions() {
  const { data: unread = 0 } = useUnreadNotificationCount();

  return (
    <div className="flex h-9 items-center gap-1.5">
      <DemoModeSwitch />
      <Link href="/map" aria-label="지도" className={headerIconButtonClassName}>
        <MapPinned />
      </Link>
      <Link
        href="/notifications"
        aria-label="알림"
        className={cn(headerIconButtonClassName, "relative")}
      >
        <Bell />
        {unread > 0 ? (
          <span
            className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary"
            aria-hidden
          />
        ) : null}
      </Link>
    </div>
  );
}
