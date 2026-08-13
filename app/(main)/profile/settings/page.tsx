"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, LogOut, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuthSession, useLogout } from "@/features/auth/hooks/use-auth";
import { getLoginMethodLabel } from "@/features/auth/lib/login-method-label";
import { cn } from "@/lib/utils";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { data: authSession, isLoading } = useAuthSession();
  const logout = useLogout();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const isLoggedIn = Boolean(authSession?.isLoggedIn);

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      setLogoutConfirmOpen(false);
      router.replace("/profile");
    } catch {
      toast.error("로그아웃하지 못했어요. 다시 시도해 주세요");
    }
  }

  return (
    <AppShell withBottomNav>
      <PageHeader title="설정" backHref="/profile" />

      <main className="mx-auto flex w-full max-w-[480px] flex-col gap-8">
        {isLoading ? (
          <p
            className="py-10 text-center text-[13px] text-ink-2"
            role="status"
          >
            설정을 불러오는 중…
          </p>
        ) : (
          <>
            <section aria-labelledby="account-title">
              <h2
                id="account-title"
                className="mb-3 text-[18px] font-semibold text-foreground"
              >
                계정
              </h2>
              {isLoggedIn ? (
                <>
                  <dl className="divide-y divide-border border-y border-border">
                    <div className="flex min-h-16 items-center gap-3 py-3">
                      <ShieldCheck
                        className="size-5 shrink-0 text-foreground"
                        strokeWidth={1.8}
                        aria-hidden
                      />
                      <dt className="text-[15px] font-semibold text-foreground">
                        로그인 방식
                      </dt>
                      <dd className="ml-auto text-right text-[13px] text-ink-2">
                        {getLoginMethodLabel(authSession?.provider)}
                      </dd>
                    </div>
                    <div className="flex min-h-16 items-center gap-3 py-3">
                      <Mail
                        className="size-5 shrink-0 text-foreground"
                        strokeWidth={1.8}
                        aria-hidden
                      />
                      <dt className="text-[15px] font-semibold text-foreground">
                        이메일
                      </dt>
                      <dd className="ml-auto min-w-0 max-w-[60%] truncate text-right text-[13px] text-ink-2">
                        {authSession?.email ?? "연결된 이메일 없음"}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-[12px] leading-5 text-ink-2">
                    여행과 때샷은 이 브라우저에서 로그인 계정별로 나뉘어
                    저장돼요.
                  </p>
                </>
              ) : (
                <div className="rounded-xl bg-secondary px-4 py-4">
                  <p className="text-[15px] font-semibold text-foreground">
                    로그인된 계정이 없어요
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-ink-2">
                    로그인하면 프로필을 수정하고 때샷을 올릴 수 있어요.
                  </p>
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "mt-3 inline-flex h-11",
                    )}
                  >
                    로그인하기
                  </Link>
                </div>
              )}
            </section>

            <section aria-labelledby="notification-title">
              <h2
                id="notification-title"
                className="mb-3 text-[18px] font-semibold text-foreground"
              >
                알림
              </h2>
              <Link
                href="/notifications"
                className="group flex min-h-16 items-center gap-3 border-y border-border py-3 outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              >
                <Bell
                  className="size-5 shrink-0 text-foreground"
                  strokeWidth={1.8}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-foreground">
                    인앱 알림
                  </p>
                  <p className="mt-1 text-[12px] leading-[1.5] text-ink-2">
                    사진 분석 결과와 여행 후 기록, 더 저렴한 상품 소식을
                    확인해요.
                  </p>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-ink-2 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.8}
                  aria-hidden
                />
              </Link>
            </section>

            {isLoggedIn ? (
              <section aria-labelledby="session-title">
                <h2 id="session-title" className="sr-only">
                  로그인 세션
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-foreground"
                  onClick={() => setLogoutConfirmOpen(true)}
                >
                  <LogOut
                    className="size-5 text-destructive"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                  로그아웃
                </Button>
              </section>
            ) : null}
          </>
        )}
      </main>

      <ConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        title="로그아웃할까요?"
        description="이 기기에 저장된 여행과 때샷은 삭제되지 않아요."
        confirmLabel={logout.isPending ? "로그아웃 중" : "로그아웃"}
        loading={logout.isPending}
        onConfirm={() => void handleLogout()}
      />
    </AppShell>
  );
}
