"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { usePendingShots } from "@/features/shots/store/pending-shots";
import type { ShotSort } from "@/features/shots/schema";
import { queryShots } from "@/features/shots/utils/shot-query";
import { ShotsFilterBar } from "@/features/shots/components/shots-filter-bar";
import { ShotPostCard } from "@/features/shots/components/shot-post-card";
import type { DestinationValue } from "@/features/shots/components/destination-filter-sheet";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";
import { useLoginGate } from "@/features/auth/hooks/use-login-gate";

/** 처음 그리는 카드 수. 이만큼은 바로 그리고, 스크롤이 가까워지면 같은 수만큼 더 그린다 */
const FEED_PAGE_SIZE = 8;
/** 첫 화면 카드 — 이미지를 최우선으로 받는다 */
const PRIORITY_CARDS = 2;
/** 이 거리(화면 높이 기준) 안으로 스크롤이 오면 다음 묶음을 그린다 */
const FEED_GROW_MARGIN = "200% 0px";

export default function ShotsPage() {
  const router = useRouter();
  const requireLogin = useLoginGate();
  const { data: loaded = [], isLoading } = useShots();
  const pending = usePendingShots();
  // 업로드 진행 중인 카드는 항상 맨 위
  const shots = useMemo(
    () => (pending.length ? [...pending, ...loaded] : loaded),
    [pending, loaded],
  );
  const { isLoading: authLoading } = useIsLoggedIn();

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

  // 100건을 한꺼번에 그리지 않고, 스크롤이 가까워질 때마다 조금씩 더 그린다.
  // 카드 하나하나는 화면 근처에 오면 이미지를 미리 받는다 (ShotPostCard).
  // 필터가 바뀌면 처음 크기로 돌아가도록, 그린 수를 필터 키와 묶어 둔다
  const filterKey = `${destination ?? ""}|${sort}`;
  const [grown, setGrown] = useState({ key: filterKey, count: FEED_PAGE_SIZE });
  // 로그인 뒤 /shots#<id> 로 돌아오면 그 카드까지는 바로 그려서 스크롤이 닿게 한다
  const [hashId] = useState(() =>
    typeof window === "undefined" ? "" : window.location.hash.slice(1),
  );
  const hashIndex = hashId ? feed.findIndex((shot) => shot.id === hashId) : -1;
  const visibleCount = Math.max(
    grown.key === filterKey ? grown.count : FEED_PAGE_SIZE,
    hashIndex + 1,
  );
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visibleCount >= feed.length) return;
    // 묶음을 더 그리면 sentinel 이 아래로 밀리고, 아직 거리 안이면 다시 걸려 이어서 그린다
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setGrown((prev) => ({
          key: filterKey,
          count: Math.min(
            feed.length,
            (prev.key === filterKey ? prev.count : FEED_PAGE_SIZE) + FEED_PAGE_SIZE,
          ),
        }));
      },
      { rootMargin: FEED_GROW_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, feed.length, filterKey]);
  const visibleFeed = feed.slice(0, visibleCount);

  function handleCreate() {
    if (
      !requireLogin({
        message: "로그인하고 때샷을 올려 보세요",
        callbackUrl: "/shots/new",
      })
    ) {
      return;
    }
    router.push("/shots/new");
  }

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

      <div className="pt-2">
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

        {isLoading || authLoading ? (
          <LoadingRegion>
            <FeedSkeleton />
          </LoadingRegion>
        ) : feed.length === 0 ? (
          <div className="px-4 pt-6 sm:px-5 md:px-6 lg:px-8">
            <EmptyState
              title="아직 때샷이 없어요. 😥"
              description="첫 때샷의 주인공이 되어 보세요!"
              actionLabel="때샷 올리기"
              onAction={handleCreate}
              secondaryLabel="다른 여행지 선택"
              onSecondary={handleSelectOtherDestination}
            />
          </div>
        ) : (
          <div className="flex flex-col pt-1">
            {visibleFeed.map((shot, i) => (
              <div
                key={shot.id}
                className="px-4 sm:px-5 md:px-6 lg:px-8"
              >
                <ShotPostCard shot={shot} priority={i < PRIORITY_CARDS} />
              </div>
            ))}
            {visibleCount < feed.length ? (
              <div ref={sentinelRef} aria-hidden>
                <LoadingRegion>
                  <FeedSkeleton count={1} />
                </LoadingRegion>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="fixed right-4 bottom-[calc(3.5rem+1rem+env(safe-area-inset-bottom))] z-30 md:right-[max(1rem,calc((100vw-720px)/2+1rem))] lg:right-[max(1rem,calc((100vw-960px)/2+1rem))]">
        <Button
          size="icon-lg"
          aria-label="때샷 올리기"
          className="size-14 rounded-full shadow-md [&_svg:not([class*='size-'])]:size-7"
          onClick={handleCreate}
        >
          <Plus strokeWidth={2.5} />
        </Button>
      </div>
    </AppShell>
  );
}
