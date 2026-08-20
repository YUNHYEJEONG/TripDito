"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { migrateDemoShotImages } from "@/features/demo";
import { shotKeys, useShots } from "@/features/shots/hooks/use-shots";
import type { ShotSort } from "@/features/shots/schema";
import { queryShots } from "@/features/shots/utils/shot-query";
import { ShotsChannelTabs } from "@/features/shots/components/shots-channel-tabs";
import { ShotsFilterBar } from "@/features/shots/components/shots-filter-bar";
import { ShotPostCard } from "@/features/shots/components/shot-post-card";
import type { DestinationValue } from "@/features/shots/components/destination-filter-sheet";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";
import { POPULAR_DESTINATIONS } from "@/features/shots/constants";
import { ItemRanking } from "@/features/shots/components/item-ranking";
import { ITEM_RANKING_CATALOG_DESTINATIONS } from "@/features/shots/data/item-ranking-catalog";
import type { ItemRankingPeriod } from "@/features/shots/utils/item-ranking";
import { itemKeys } from "@/features/shopping-items/hooks/use-items";
import { itemRepository } from "@/features/shopping-items/data/item-repository";
import { useTrips } from "@/features/trips/hooks/use-trips";
import { cn } from "@/lib/utils";

type ShotsView = "shots" | "ranking" | "community";

function getShotsView(value: string | null): ShotsView {
  if (value === "ranking" || value === "item-ranking") return "ranking";
  if (value === "community") return "community";
  return "shots";
}

function getRankingPeriod(value: string | null): ItemRankingPeriod {
  if (value === "weekly" || value === "monthly") return value;
  return "realtime";
}

export default function ShotsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: shots = [], isLoading } = useShots();
  const { isLoggedIn } = useIsLoggedIn();
  const view = getShotsView(searchParams.get("tab"));
  const period = getRankingPeriod(searchParams.get("period"));
  const { data: trips = [], isLoading: tripsLoading } = useTrips();
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: itemKeys.all,
    queryFn: () => itemRepository.listAll(),
    enabled: view === "ranking",
  });

  const city = searchParams.get("city");
  const country = searchParams.get("country");
  const urlDestination: DestinationValue =
    city && country ? { city, country } : null;
  const hotDestination =
    searchParams.get("source") === "hot" ? urlDestination : null;
  const sheetDestination = hotDestination ? null : urlDestination;
  const sort: ShotSort =
    searchParams.get("sort") === "likes" ? "likes" : "newest";
  const [destinationOpen, setDestinationOpen] = useState(false);

  const destination = hotDestination ?? sheetDestination;
  const destinationOptions = useMemo(() => {
    const options = new Map<string, { city: string; country: string }>();
    for (const option of POPULAR_DESTINATIONS) {
      options.set(`${option.country}::${option.city}`, option);
    }
    for (const shot of shots) {
      const option = {
        city: shot.destinationCity,
        country: shot.destinationCountry,
      };
      options.set(`${option.country}::${option.city}`, option);
    }
    for (const trip of trips) {
      const option = { city: trip.city, country: trip.country };
      options.set(`${option.country}::${option.city}`, option);
    }
    return [...options.values()].sort((a, b) =>
      a.city.localeCompare(b.city, "ko-KR"),
    );
  }, [shots, trips]);
  const rankingDestinationOptions = useMemo(() => {
    const options = new Map(
      destinationOptions.map((option) => [
        `${option.country}::${option.city}`,
        option,
      ]),
    );
    for (const option of ITEM_RANKING_CATALOG_DESTINATIONS) {
      options.set(`${option.country}::${option.city}`, option);
    }
    return [...options.values()].sort((a, b) =>
      a.city.localeCompare(b.city, "ko-KR"),
    );
  }, [destinationOptions]);
  const feedChannel = view === "community" ? "community" : "shots";
  const channelShots = useMemo(
    () => shots.filter((shot) => shot.channel === feedChannel),
    [feedChannel, shots],
  );
  const feed = useMemo(
    () => queryShots(shots, { channel: feedChannel, destination, sort }),
    [shots, feedChannel, destination, sort],
  );

  useEffect(() => {
    const updated = migrateDemoShotImages();
    if (!updated) return;
    void queryClient.invalidateQueries({ queryKey: shotKeys.all });
  }, [queryClient]);

  function replaceFilterUrl(
    nextDestination: DestinationValue,
    nextSort: ShotSort,
    source: "hot" | "sheet" | null,
  ) {
    const params = new URLSearchParams(window.location.search);
    if (nextDestination) {
      params.set("city", nextDestination.city);
      params.set("country", nextDestination.country);
    } else {
      params.delete("city");
      params.delete("country");
    }
    if (nextDestination && source === "hot") params.set("source", "hot");
    else params.delete("source");
    if (nextSort === "likes") params.set("sort", nextSort);
    else params.delete("sort");
    const search = params.toString();
    router.replace(
      `${pathname}${search ? `?${search}` : ""}${window.location.hash}`,
      { scroll: false },
    );
  }

  function handleSheetDestinationChange(value: DestinationValue) {
    replaceFilterUrl(value, sort, value ? "sheet" : null);
  }

  function handleHotDestinationChange(value: DestinationValue) {
    replaceFilterUrl(value, sort, value ? "hot" : null);
  }

  function handleSortChange(value: ShotSort) {
    replaceFilterUrl(
      destination,
      value,
      hotDestination ? "hot" : sheetDestination ? "sheet" : null,
    );
  }

  function handleSelectOtherDestination() {
    setDestinationOpen(true);
  }

  function replaceRankingUrl(
    nextDestination: DestinationValue,
    nextPeriod: ItemRankingPeriod,
  ) {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "ranking");
    if (nextDestination) {
      params.set("city", nextDestination.city);
      params.set("country", nextDestination.country);
    } else {
      params.delete("city");
      params.delete("country");
    }
    if (nextPeriod === "realtime") params.delete("period");
    else params.set("period", nextPeriod);
    params.delete("source");
    params.delete("sort");
    router.replace(`${pathname}?${params.toString()}${window.location.hash}`, {
      scroll: false,
    });
  }

  const createHref =
    view === "community" ? "/shots/new?channel=community" : "/shots/new";
  const uploadLabel = view === "community" ? "이야기 올리기" : "때샷 올리기";

  return (
    <AppShell
      withBottomNav
      surface="feed"
      className={cn(
        "px-0",
        isLoggedIn &&
          view !== "ranking" &&
          "pb-[calc(var(--tab-bar-height)+6rem+env(safe-area-inset-bottom))]",
      )}
    >
      <ShotsChannelTabs active="shots" shotView={view} />

      <main className="flex flex-col">
        {view === "ranking" ? (
          isLoading || tripsLoading || itemsLoading ? (
            <p
              className="px-4 py-10 text-center text-[13px] text-ink-2"
              role="status"
            >
              랭킹을 집계하는 중이에요
            </p>
          ) : (
            <ItemRanking
              items={items}
              trips={trips}
              shots={shots}
              period={period}
              destination={destination}
              destinations={rankingDestinationOptions}
              onPeriodChange={(nextPeriod) =>
                replaceRankingUrl(destination, nextPeriod)
              }
              onDestinationChange={(nextDestination) =>
                replaceRankingUrl(nextDestination, period)
              }
            />
          )
        ) : (
          <>
            <div className="mx-auto w-full max-w-[480px] px-4">
              <ShotsFilterBar
                shots={channelShots}
                sheetDestination={sheetDestination}
                hotDestination={hotDestination}
                sort={sort}
                onSheetDestinationChange={handleSheetDestinationChange}
                onHotDestinationChange={handleHotDestinationChange}
                onSortChange={handleSortChange}
                destinationOpen={destinationOpen}
                onDestinationOpenChange={setDestinationOpen}
                destinations={destinationOptions}
              />
            </div>

            {isLoading ? (
              <p
                className="px-4 py-10 text-center text-[13px] text-ink-2"
                role="status"
              >
                {view === "community"
                  ? "커뮤니티 글을 불러오는 중이에요"
                  : "때샷을 불러오는 중이에요"}
              </p>
            ) : feed.length === 0 ? (
              <div className="mx-auto w-full max-w-[480px] px-4 pt-6">
                <EmptyState
                  title={
                    view === "community"
                      ? "선택한 여행지의 이야기가 아직 없어요"
                      : "선택한 여행지의 때샷이 아직 없어요"
                  }
                  description={
                    view === "community"
                      ? "여행 팁이나 쇼핑 동선을 첫 글로 나눠보세요."
                      : "다른 여행지를 살펴보거나 첫 때샷을 올려보세요."
                  }
                  actionLabel={uploadLabel}
                  onAction={() => router.push(createHref)}
                  secondaryLabel="다른 여행지 보기"
                  onSecondary={handleSelectOtherDestination}
                />
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-[480px] flex-col">
                <p className="sr-only" role="status">
                  {view === "community" ? "커뮤니티 글" : "때샷"} {feed.length}
                  개
                </p>
                {feed.map((shot, index) => (
                  <ShotPostCard
                    key={shot.id}
                    shot={shot}
                    preloadImage={index === 0}
                    resumeComments={searchParams.get("comments") === shot.id}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {isLoggedIn && view !== "ranking" ? (
        <div className="fixed right-[max(1rem,calc((100dvw-480px)/2+1rem))] bottom-[calc(var(--tab-bar-height)+1rem+env(safe-area-inset-bottom))] z-30">
          <Button
            size="icon-lg"
            aria-label={uploadLabel}
            className="size-14 rounded-full shadow-float [&_svg:not([class*='size-'])]:size-6"
            onClick={() => router.push(createHref)}
          >
            <Camera strokeWidth={1.9} />
          </Button>
        </div>
      ) : null}
    </AppShell>
  );
}
