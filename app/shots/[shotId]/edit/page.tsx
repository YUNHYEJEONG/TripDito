"use client";

import { use, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import {
  PageHeader,
  HeaderCancelButton,
} from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { ShotUploadForm } from "@/features/shots/components/shot-upload-form";
import {
  useShot,
  useUpdateShot,
} from "@/features/shots/hooks/use-shots";
import { useLocalProfile } from "@/features/profile/hooks/use-local-profile";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";
import type { ShotFormValues } from "@/features/shots/schema";
import { requestPageNavigation } from "@/lib/navigation/unsaved-changes";

export default function EditShotPage({
  params,
}: {
  params: Promise<{ shotId: string }>;
}) {
  const { shotId } = use(params);
  const router = useRouter();
  const { data: shot, isLoading } = useShot(shotId);
  const { data: profile } = useLocalProfile();
  const { isLoggedIn, isLoading: authLoading } = useIsLoggedIn();
  const updateShot = useUpdateShot(shotId);
  const channelHref =
    shot?.channel === "community" ? "/shots?tab=community" : "/shots";

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace(
        `/login?returnTo=${encodeURIComponent(`/shots/${shotId}/edit`)}`,
      );
    }
  }, [authLoading, isLoggedIn, router, shotId]);

  const formDefaults = useMemo((): Partial<ShotFormValues> | undefined => {
    if (!shot) return undefined;
    return {
      channel: shot.channel,
      tripId: shot.tripId,
      images: shot.images,
      body: shot.body,
      pins: shot.pins,
      shoppingItemIds: shot.shoppingItemIds,
    };
  }, [shot]);

  if (authLoading || !isLoggedIn || isLoading) {
    return (
      <AppShell>
        <p className="py-16 text-center text-sm text-muted-foreground">
          불러오는 중…
        </p>
      </AppShell>
    );
  }

  if (!shot || !formDefaults) {
    return (
      <AppShell>
        <EmptyState
          title="피드를 찾을 수 없어요"
          actionLabel="목록으로"
          onAction={() => router.push("/shots")}
        />
      </AppShell>
    );
  }

  if (profile && shot.authorId !== profile.id) {
    return (
      <AppShell>
        <EmptyState
          title="수정 권한이 없어요"
          description="내가 작성한 피드만 수정할 수 있어요."
          actionLabel="목록으로"
          onAction={() => router.push("/shots")}
        />
      </AppShell>
    );
  }

  return (
    <AppShell className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <PageHeader
        title="피드 수정"
        className="mb-3"
        actions={
          <HeaderCancelButton
            onClick={() =>
              requestPageNavigation(() => router.push(channelHref))
            }
          />
        }
      />
      <ShotUploadForm
        key={shot.id}
        formId="shot-edit-form"
        defaultValues={formDefaults}
        onSubmit={async (values) => {
          try {
            await updateShot.mutateAsync(values);
            router.push(channelHref);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "저장하지 못했어요";
            toast.error(message);
          }
        }}
      />
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[var(--app-rail-max)] border-t border-rule bg-paper px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] min-[481px]:border-x">
        <div className="w-full">
          <Button
            type="submit"
            form="shot-edit-form"
            className="w-full"
            disabled={updateShot.isPending}
          >
            변경 내용 저장
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
