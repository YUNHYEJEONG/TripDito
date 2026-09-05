"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import {
  PageHeader,
  HeaderCancelButton,
} from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ShotUploadForm } from "@/features/shots/components/shot-upload-form";
import { useCreateShot } from "@/features/shots/hooks/use-shots";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";
import { pendingShots } from "@/features/shots/store/pending-shots";

export default function NewShotPage() {
  const router = useRouter();
  const createShot = useCreateShot();
  const { isLoggedIn, isLoading } = useIsLoggedIn();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading || !isLoggedIn) {
    return (
      <AppShell>
        <p className="py-16 text-center text-[13px] text-muted-foreground">
          불러오는 중…
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <PageHeader
        title="피드 업로드"
        className="mb-3"
        actions={
          <HeaderCancelButton onClick={() => router.push("/shots")} />
        }
      />
      <ShotUploadForm
        formId="shot-upload-form"
        onSubmit={(values) => {
          // 업로드는 백그라운드로 보내고 피드로 바로 이동 → 맨 위에 "업로드 중" 카드가 보인다
          // 결과 토스트는 훅(useCreateShot)에서 띄운다 — 이 화면은 곧 언마운트되므로
          createShot.mutate({ input: values, pendingId: pendingShots.newId() });
          router.push("/shots");
        }}
      />
      <div className="fixed inset-x-0 bottom-0 z-30 bg-canvas px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 md:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[480px] md:max-w-[720px] lg:max-w-[960px]">
          <Button
            type="submit"
            form="shot-upload-form"
            className="w-full"
            disabled={createShot.isPending}
          >
            업로드
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
