"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ProfileShotGrid } from "@/features/profile/components/profile-shot-grid";
import { useLocalProfile } from "@/features/profile/hooks/use-local-profile";
import { useShots } from "@/features/shots/hooks/use-shots";

export default function MyShotsPage() {
  const { data: profile, isLoading: profileLoading } = useLocalProfile();
  const { data: shots = [], isLoading: shotsLoading } = useShots();
  const myShots = profile
    ? shots
        .filter(
          (shot) =>
            shot.channel === "shots" && shot.authorId === profile.id,
        )
        .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    : [];
  const isLoading = profileLoading || shotsLoading;

  return (
    <AppShell withBottomNav>
      <PageHeader title="내 때샷" backHref="/profile" />

      <main className="mx-auto w-full max-w-[480px]">
        {isLoading ? (
          <p
            className="py-10 text-center text-[13px] text-ink-2"
            role="status"
          >
            내 때샷을 불러오는 중…
          </p>
        ) : myShots.length === 0 ? (
          <EmptyState
            title="올린 때샷이 없어요"
            description="여행에서 담아 온 물건을 찍어 첫 때샷을 남겨 보세요."
          />
        ) : (
          <ProfileShotGrid shots={myShots} />
        )}
      </main>
    </AppShell>
  );
}
