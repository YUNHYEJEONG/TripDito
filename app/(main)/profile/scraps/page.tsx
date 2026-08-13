"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ProfileShotGrid } from "@/features/profile/components/profile-shot-grid";
import { useScraps } from "@/features/shots/hooks/use-scraps";
import { useShots } from "@/features/shots/hooks/use-shots";

export default function ProfileScrapsPage() {
  const { data: scraps = [], isLoading: scrapsLoading } = useScraps();
  const { data: shots = [], isLoading: shotsLoading } = useShots();
  const shotById = new Map(shots.map((shot) => [shot.id, shot]));
  const scrappedShots = scraps.flatMap((scrap) => {
    const shot = shotById.get(scrap.shotId);
    return shot ? [shot] : [];
  });
  const isLoading = scrapsLoading || shotsLoading;

  return (
    <AppShell withBottomNav>
      <PageHeader title="스크랩" backHref="/profile" />

      <main className="mx-auto w-full max-w-[480px]">
        {isLoading ? (
          <p
            className="py-10 text-center text-[13px] text-ink-2"
            role="status"
          >
            스크랩을 불러오는 중…
          </p>
        ) : scrappedShots.length === 0 ? (
          <EmptyState
            title="스크랩한 때샷이 없어요"
            description="구경에서 북마크한 때샷이 이곳에 모여요."
          />
        ) : (
          <ProfileShotGrid shots={scrappedShots} />
        )}
      </main>
    </AppShell>
  );
}
