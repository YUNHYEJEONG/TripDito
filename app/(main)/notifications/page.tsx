"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgePercent, Bell, CheckCheck, Sparkles, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/hooks/use-notifications";
import type { AppNotificationType } from "@/features/notifications/types";
import { getSafeReturnTo, withReturnTo } from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";

const ICONS = {
  "trip-ended-favorite": Star,
  "analysis-done": Sparkles,
  "coupang-cheaper": BadgePercent,
  general: Bell,
} satisfies Record<AppNotificationType, typeof Bell>;

function safeNotificationHref(href: string): string {
  return href.startsWith("/") && !href.startsWith("//") ? href : "/home";
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsLoading />}>
      <NotificationsPageContent />
    </Suspense>
  );
}

function NotificationsLoading() {
  return (
    <AppShell withBottomNav>
      <PageHeader title="알림" backHref="/home" />
      <p className="py-12 text-center text-[14px] text-ink-2" role="status">
        알림을 불러오는 중…
      </p>
    </AppShell>
  );
}

function NotificationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"), "/home");
  const notificationReturnTo = withReturnTo("/notifications", returnTo);
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <AppShell withBottomNav>
      <PageHeader
        title="알림"
        backHref={returnTo}
        actions={
          unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-11 px-2 text-[13px]"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck aria-hidden />
              모두 읽음
            </Button>
          ) : null
        }
      />

      <main>
        {isLoading ? (
          <p className="py-12 text-center text-[14px] text-ink-2" role="status">
            알림을 불러오는 중…
          </p>
        ) : notifications.length === 0 ? (
          <EmptyState
            title="아직 새로운 알림이 없어요"
            description="사진 분석 결과와 여행이 끝난 뒤의 소식, 더 저렴한 상품 정보를 여기에 모아 드려요."
          />
        ) : (
          <ul className="divide-y divide-rule border-y border-rule" aria-label="알림 목록">
            {notifications.map((item) => {
              const Icon = ICONS[item.type] ?? Bell;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex min-h-24 w-full items-start gap-3 px-1 py-4 text-left outline-none transition-colors duration-120 hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus",
                      !item.read && "bg-brand-soft/45",
                    )}
                    onClick={() => {
                      markRead.mutate(item.id, {
                        onSettled: () =>
                          router.push(
                            withReturnTo(
                              safeNotificationHref(item.href),
                              notificationReturnTo,
                            ),
                          ),
                      });
                    }}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-paper-2 text-accent-text">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold leading-snug text-foreground">
                        {item.title}
                      </span>
                      {item.body ? (
                        <span className="mt-1 block text-[13px] leading-5 text-ink-2">
                          {item.body}
                        </span>
                      ) : null}
                      <time
                        dateTime={item.createdAt}
                        className="mt-1.5 block text-[12px] text-ink-2"
                      >
                        {new Date(item.createdAt).toLocaleString("ko-KR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </time>
                    </span>
                    {!item.read ? (
                      <span className="mt-2 size-2 shrink-0 rounded-full bg-accent-text">
                        <span className="sr-only">읽지 않음</span>
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
