"use client";

import { useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, FlaskConical, TimerReset, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { storageKeys } from "@/lib/storage/keys";
import { createAccountScopedStorage } from "@/lib/storage/local-storage";
import { getStorageUsage } from "@/lib/storage/usage";
import { suppressAutomaticDemoData } from "@/features/demo";
import {
  isDemoMode,
  setDemoMode,
  subscribeDemoMode,
} from "@/features/demo/lib/demo-mode";
import { itemRepository } from "@/features/shopping-items/data/item-repository";
import { cn } from "@/lib/utils";

const DATA_STORAGE_KEYS = [
  storageKeys.trips,
  storageKeys.items,
  storageKeys.meta,
  storageKeys.shots,
  storageKeys.scraps,
  storageKeys.profile,
  storageKeys.receivedCoupons,
  storageKeys.activeTrip,
  storageKeys.analysisJob,
  storageKeys.notifications,
  storageKeys.demoMode,
  storageKeys.shoppingFavorites,
  storageKeys.shoppingCompatMigration,
] as const;

export default function ProfileDataPage() {
  const queryClient = useQueryClient();
  const [demoConfirmOpen, setDemoConfirmOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const fastCompare = useSyncExternalStore(
    subscribeDemoMode,
    isDemoMode,
    () => false,
  );
  const [resetting, setResetting] = useState(false);
  const { data: usage, isLoading } = useQuery({
    queryKey: ["profile-storage-usage"],
    queryFn: getStorageUsage,
    staleTime: 0,
  });

  function toggleFastCompare() {
    const next = !fastCompare;
    setDemoMode(next);
    if (next) {
      const accelerated = itemRepository.acceleratePendingCoupangCompare();
      toast.success(
        accelerated > 0
          ? `대기 중인 가격 비교 ${accelerated}건을 시작해요`
          : "새 상품의 가격 비교를 5초 뒤 시작해요",
      );
    } else {
      toast.message("새 상품의 가격 비교 대기를 1시간으로 되돌렸어요");
    }
  }

  async function handleLoadDemo() {
    setDemoLoading(true);
    try {
      const { replaceWithDemoData } = await import("@/features/demo");
      replaceWithDemoData(createAccountScopedStorage(window.localStorage));
      await queryClient.invalidateQueries();
      setDemoConfirmOpen(false);
      toast.success("데모 여행과 때샷을 불러왔어요");
    } catch {
      toast.error("데모 데이터를 불러오지 못했어요. 다시 시도해 주세요");
    } finally {
      setDemoLoading(false);
    }
  }

  async function handleResetData() {
    setResetting(true);
    try {
      const scopedStorage = createAccountScopedStorage(window.localStorage);
      for (const key of DATA_STORAGE_KEYS) {
        scopedStorage.removeItem(key);
      }
      suppressAutomaticDemoData(scopedStorage);
      await queryClient.invalidateQueries();
      setResetConfirmOpen(false);
      toast.success("여행 데이터를 초기화했어요");
    } catch {
      toast.error("데이터를 초기화하지 못했어요. 다시 시도해 주세요");
    } finally {
      setResetting(false);
    }
  }

  return (
    <AppShell withBottomNav>
      <PageHeader title="데이터 관리" backHref="/profile" />

      <main className="mx-auto flex w-full max-w-[480px] flex-col gap-8">
        <section aria-labelledby="storage-title">
          <h2
            id="storage-title"
            className="mb-3 text-[18px] font-semibold text-foreground"
          >
            저장 공간
          </h2>
          <div className="rounded-xl bg-secondary px-4 py-4">
            <div className="flex items-center gap-3">
              <Database
                className="size-5 shrink-0 text-foreground"
                strokeWidth={1.8}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-foreground">
                  이 기기에 저장된 데이터
                </p>
                <p className="mt-1 text-[13px] leading-5 text-ink-2">
                  여행, 이미지, 때샷과 쿠폰을 이 브라우저에 저장해요. 로그인한
                  계정마다 따로 관리해요.
                </p>
              </div>
              <strong
                className="shrink-0 text-[15px] font-semibold text-foreground tabular-nums"
                aria-live="polite"
              >
                {isLoading || !usage ? "계산 중" : usage.usedLabel}
              </strong>
            </div>
            {usage?.level === "warn" || usage?.level === "danger" ? (
              <p
                className="mt-3 border-t border-border pt-3 text-[13px] leading-5 text-ink-2"
                role="status"
              >
                저장 공간이 부족해질 수 있어요. 필요 없는 이미지를 정리해 주세요.
              </p>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="data-actions-title">
          <h2
            id="data-actions-title"
            className="mb-3 text-[18px] font-semibold text-foreground"
          >
            데이터 도구
          </h2>
          <div className="divide-y divide-border border-y border-border">
            <div className="flex items-center gap-3 py-4">
              <FlaskConical
                className="size-5 shrink-0 text-foreground"
                strokeWidth={1.8}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-foreground">
                  데모 데이터 불러오기
                </p>
                <p className="mt-1 text-[12px] leading-[1.5] text-ink-2">
                  현재 여행과 때샷을 예시 데이터로 바꿔요.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-11"
                onClick={() => setDemoConfirmOpen(true)}
              >
                불러오기
              </Button>
            </div>

            <div className="flex items-center gap-3 py-4">
              <TimerReset
                className="size-5 shrink-0 text-foreground"
                strokeWidth={1.8}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-foreground">
                  가격 비교 빠른 테스트
                </p>
                <p className="mt-1 text-[12px] leading-[1.5] text-ink-2">
                  쿠팡 비교 대기를 1시간에서 5초로 줄여요. 예시 데이터와는 별개예요.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={fastCompare}
                aria-label="가격 비교 빠른 테스트"
                onClick={toggleFastCompare}
                className={cn(
                  "relative h-11 w-[3.25rem] shrink-0 rounded-full border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                  fastCompare
                    ? "border-accent-text bg-accent-text"
                    : "border-control bg-paper-3",
                )}
              >
                <span
                  className={cn(
                    "absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-paper shadow-card transition-[left] duration-200",
                    fastCompare ? "left-[1.65rem]" : "left-1",
                  )}
                  aria-hidden
                />
                <span className="sr-only">{fastCompare ? "켜짐" : "꺼짐"}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 py-4">
              <Trash2
                className="size-5 shrink-0 text-destructive"
                strokeWidth={1.8}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-foreground">
                  여행 데이터 초기화
                </p>
                <p className="mt-1 text-[12px] leading-[1.5] text-ink-2">
                  로그인 계정은 남기고 저장한 여행 데이터를 지워요.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-11"
                onClick={() => setResetConfirmOpen(true)}
              >
                초기화
              </Button>
            </div>
          </div>
        </section>
      </main>

      <ConfirmDialog
        open={demoConfirmOpen}
        onOpenChange={setDemoConfirmOpen}
        title="데모 데이터를 불러올까요?"
        description="현재 여행, 쇼핑리스트, 때샷과 프로필이 예시 데이터로 바뀌어요."
        confirmLabel={demoLoading ? "불러오는 중" : "데모로 바꾸기"}
        confirmVariant="default"
        loading={demoLoading}
        onConfirm={() => void handleLoadDemo()}
      />
      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="여행 데이터를 초기화할까요?"
        description="여행, 쇼핑리스트, 때샷, 스크랩, 쿠폰과 프로필이 삭제돼요. 로그인 계정은 유지돼요."
        confirmLabel={resetting ? "초기화 중" : "초기화"}
        loading={resetting}
        onConfirm={() => void handleResetData()}
      />
    </AppShell>
  );
}
