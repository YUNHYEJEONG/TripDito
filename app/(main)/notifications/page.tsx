"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import {
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/hooks/use-notifications";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const router = useRouter();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <AppShell withBottomNav>
      <PageHeader title="알림" backHref="/home" />

      {isLoading ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          불러오는 중…
        </p>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="알림이 없어요"
          description="여행이 끝난 뒤 소식, 분석 안내, 쿠팡 저가 알림이 여기에 모여요."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border border-border/80 bg-background px-3.5 py-3 text-left",
                  !item.read && "bg-brand-soft/40",
                )}
                onClick={() => {
                  markRead.mutate(item.id, {
                    onSettled: () => router.push(item.href),
                  });
                }}
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-primary">
                  <Bell className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium leading-snug text-foreground">
                    {item.title}
                  </span>
                  {item.body ? (
                    <span className="mt-0.5 block text-[12px] text-muted-foreground">
                      {item.body}
                    </span>
                  ) : null}
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("ko-KR")}
                  </span>
                </span>
                {!item.read ? (
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
