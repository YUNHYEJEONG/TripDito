"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ProfileShotGrid } from "@/features/profile/components/profile-shot-grid";
import { useShots } from "@/features/shots/hooks/use-shots";

export default function ProfileLikesPage() {
  const { data: shots = [], isLoading } = useShots();
  const likedShots = shots
    .filter((shot) => shot.likedByMe)
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <AppShell withBottomNav>
      <PageHeader title="좋아요" backHref="/profile" />

      <main className="mx-auto w-full max-w-[480px]">
        {isLoading ? (
          <p
            className="py-10 text-center text-[13px] text-ink-2"
            role="status"
          >
            좋아요를 불러오는 중…
          </p>
        ) : likedShots.length === 0 ? (
          <EmptyState
            title="좋아요한 때샷이 없어요"
            description="구경에서 하트를 누른 때샷이 이곳에 모여요."
          />
        ) : (
          <ProfileShotGrid shots={likedShots} />
        )}
      </main>
    </AppShell>
  );
}
