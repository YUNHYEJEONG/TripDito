"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { HeaderNavActions } from "@/components/layout/header-nav-actions";
import { EmptyState } from "@/components/common/empty-state";
import {
  FeedSkeleton,
  LoadingRegion,
} from "@/components/common/loading-skeletons";
import { Button } from "@/components/ui/button";
import { useShots } from "@/features/shots/hooks/use-shots";
import type { ShotSort } from "@/features/shots/schema";
import { queryShots } from "@/features/shots/utils/shot-query";
import {
  ShotsChannelTabs,
  type ShotsTab,
} from "@/features/shots/components/shots-channel-tabs";
import { ShotsFilterBar } from "@/features/shots/components/shots-filter-bar";
import { ShotPostCard } from "@/features/shots/components/shot-post-card";
import type { DestinationValue } from "@/features/shots/components/destination-filter-sheet";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";

export default function ShotsPage() {
  const router = useRouter();
  const { data: shots = [], isLoading } = useShots();
  const { isLoggedIn, isLoading: authLoading } = useIsLoggedIn();

  const [tab, setTab] = useState<ShotsTab>("shots");
  const [sheetDestination, setSheetDestination] =
    useState<DestinationValue>(null);
  const [hotDestination, setHotDestination] =
    useState<DestinationValue>(null);
  const [sort, setSort] = useState<ShotSort>("newest");
  const [destinationOpen, setDestinationOpen] = useState(false);

  const destination = hotDestination ?? sheetDestination;

  const feed = useMemo(
    () =>
      queryShots(shots, {
        channel: "shots",
        destination,
        sort,
      }),
    [shots, destination, sort],
  );

  function handleSheetDestinationChange(value: DestinationValue) {
    setSheetDestination(value);
    setHotDestination(null);
  }

  function handleHotDestinationChange(value: DestinationValue) {
    setHotDestination(value);
    setSheetDestination(null);
  }

  function handleSelectOtherDestination() {
    setHotDestination(null);
    setDestinationOpen(true);
  }

  return (
    <AppShell withBottomNav className="px-0 sm:px-0 md:px-0 lg:px-0">
      <PageHeader
        title="때샷구경"
        actions={<HeaderNavActions />}
        className="sticky top-0 z-30 mx-0 mb-0 bg-canvas/95 px-4 sm:px-5 md:px-6 lg:px-8"
      />

      <ShotsChannelTabs value={tab} onChange={setTab} />

      {tab === "community" ? (
        <div className="px-4 pt-6 sm:px-5 md:px-6 lg:px-8">
          <EmptyState
            title="커뮤니티 준비 중"
            description="곧 여행 이야기를 나눌 수 있는 커뮤니티가 열려요."
          />
        </div>
      ) : (
        <>
          <div className="px-4 sm:px-5 md:px-6 lg:px-8">
            <ShotsFilterBar
              shots={shots}
              sheetDestination={sheetDestination}
              hotDestination={hotDestination}
              sort={sort}
              onSheetDestinationChange={handleSheetDestinationChange}
              onHotDestinationChange={handleHotDestinationChange}
              onSortChange={setSort}
              destinationOpen={destinationOpen}
              onDestinationOpenChange={setDestinationOpen}
            />
          </div>

          {!authLoading && !isLoggedIn ? (
            <div className="px-4 pt-6 sm:px-5 md:px-6 lg:px-8">
              <EmptyState
                title="로그인하고 때샷을 구경해 보세요"
                description="다른 여행자의 쇼핑 순간을 보려면 로그인이 필요해요."
                actionLabel="로그인"
                onAction={() => router.push("/login")}
              />
            </div>
          ) : isLoading || authLoading ? (
            <LoadingRegion>
              <FeedSkeleton />
            </LoadingRegion>
          ) : feed.length === 0 ? (
            <div className="px-4 pt-6 sm:px-5 md:px-6 lg:px-8">
              <EmptyState
                title="아직 때샷이 없어요. 😥"
                description="첫 때샷의 주인공이 되어 보세요!"
                actionLabel="때샷 올리기"
                onAction={() => router.push("/shots/new")}
                secondaryLabel="다른 여행지 선택"
                onSecondary={handleSelectOtherDestination}
              />
            </div>
          ) : (
            <div className="flex flex-col pt-1">
              {feed.map((shot) => (
                <div
                  key={shot.id}
                  className="px-4 sm:px-5 md:px-6 lg:px-8"
                >
                  <ShotPostCard shot={shot} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "shots" && isLoggedIn ? (
        <div className="fixed right-4 bottom-[calc(3.5rem+1rem+env(safe-area-inset-bottom))] z-30 md:right-[max(1rem,calc((100vw-720px)/2+1rem))] lg:right-[max(1rem,calc((100vw-960px)/2+1rem))]">
          <Button
            size="icon-lg"
            aria-label="때샷 올리기"
            className="size-14 rounded-full shadow-md [&_svg:not([class*='size-'])]:size-7"
            onClick={() => router.push("/shots/new")}
          >
            <Plus strokeWidth={2.5} />
          </Button>
        </div>
      ) : null}
    </AppShell>
  );
}
