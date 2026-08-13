"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Luggage } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { Shot } from "@/features/shots/schema";
import { useShots } from "@/features/shots/hooks/use-shots";
import { queryShots } from "@/features/shots/utils/shot-query";
import type { Trip } from "@/features/trips/types";
import {
  formatScheduleBadge,
  getTripScheduleLabel,
} from "@/features/home/utils/get-upcoming-trip";
import { formatTripDateMd } from "@/features/home/utils/trip-card-meta";
import { withReturnTo } from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";

type HomeEverydayStateProps = {
  /** 평소 홈에서도 놓치지 않도록 보여 줄 가장 가까운 미래 여행 */
  upcomingTrip?: Trip | null;
  /** 평소 홈에서 사용자가 직접 다른 여행을 고르는 진입점 */
  onSwitchTrip?: () => void;
  /** 다음 여행 카드 바로 뒤에 붙는 모바일 준비 도구 */
  children?: React.ReactNode;
};

export function HomeEverydayState({
  upcomingTrip = null,
  onSwitchTrip,
  children,
}: HomeEverydayStateProps) {
  const { data: shots = [], isLoading, isError } = useShots();
  const popularShots = getRecentPopularShots(shots);

  return (
    <div className="space-y-5">
      <EverydayTripPrompt
        upcomingTrip={upcomingTrip}
        onSwitchTrip={onSwitchTrip}
      />
      {children}
      <PopularShots
        shots={popularShots}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}

function EverydayTripPrompt({
  upcomingTrip,
  onSwitchTrip,
}: {
  upcomingTrip: Trip | null;
  onSwitchTrip?: () => void;
}) {
  const schedule = upcomingTrip
    ? formatScheduleBadge(getTripScheduleLabel(upcomingTrip))
    : null;
  const title = upcomingTrip
    ? `다음 여행은 ${upcomingTrip.city}예요`
    : "다음 여행, 어디로 갈까요?";

  return (
    <section
      aria-labelledby="everyday-trip-title"
      className="rounded-2xl border border-rule bg-paper p-4 shadow-card"
    >
      {onSwitchTrip ? (
        <button
          type="button"
          onClick={onSwitchTrip}
          className="mb-4 flex min-h-16 w-full items-center gap-3 rounded-xl border border-rule bg-paper-2 px-3 py-2.5 text-left outline-none transition-colors duration-120 hover:bg-paper-3 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          aria-label="내 여행 목록 열기"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-paper text-ink shadow-neu-inset">
            <Luggage className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-[14px] font-semibold text-ink">
              내 여행
            </strong>
            <span className="mt-0.5 block truncate text-[12px] text-ink-2">
              {upcomingTrip
                ? `${upcomingTrip.name} 선택됨`
                : "여행을 선택하거나 관리하세요"}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-accent-text">
            목록
            <ChevronRight className="size-4" aria-hidden />
          </span>
        </button>
      ) : null}
      <h2
        id="everyday-trip-title"
        className="text-[21px] leading-[1.3] font-bold tracking-[-0.025em] text-ink [overflow-wrap:anywhere]"
      >
        {title}
      </h2>
      <p className="mt-2 text-[14px] leading-5 text-ink-2">
        {upcomingTrip
          ? "출발 전에도 쇼핑리스트·쿠폰·환율을 미리 확인할 수 있어요."
          : "여행을 만들면 쇼핑 준비가 시작돼요."}
      </p>

      {upcomingTrip ? (
        <Link
          href={withReturnTo(`/trips/${upcomingTrip.id}`, "/home")}
          aria-label={`${schedule}, ${upcomingTrip.city} 여행 보기`}
          className="group mt-4 flex min-h-14 items-center gap-3 rounded-xl bg-paper-2 px-3 py-2.5 outline-none transition-colors duration-120 hover:bg-paper-3 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <span className="shrink-0 rounded-lg bg-paper px-2 py-1 text-[12px] font-semibold tabular-nums text-accent-text shadow-neu-inset">
            {schedule}
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-[14px] font-semibold text-ink">
              {upcomingTrip.city} 여행
            </strong>
            <time
              dateTime={upcomingTrip.startDate}
              className="mt-0.5 block truncate text-[12px] text-ink-2"
            >
              {formatTripDateMd(upcomingTrip.startDate)} 출발 · 여행 보기
            </time>
          </span>
          <ChevronRight
            className="size-5 shrink-0 text-ink-3 transition-transform duration-120 group-hover:translate-x-0.5"
            strokeWidth={1.8}
            aria-hidden
          />
        </Link>
      ) : null}

      <Link
        href="/trips/new"
        className={cn(
          buttonVariants({ size: "lg" }),
          "mt-4 w-full rounded-xl",
        )}
      >
        {upcomingTrip ? "다른 여행 만들기" : "새 여행 만들기"}
      </Link>
    </section>
  );
}

function PopularShots({
  shots,
  isLoading,
  isError,
}: {
  shots: Shot[];
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <section aria-labelledby="popular-shots-title">
      <div className="mb-2.5 flex min-h-11 items-center justify-between gap-3">
        <h2 id="popular-shots-title" className="text-[18px] text-ink">
          요즘 인기 때샷
        </h2>
        <Link
          href="/shots?sort=likes"
          className="-mr-2 inline-flex min-h-11 items-center gap-0.5 rounded-lg px-2 text-[13px] font-semibold text-accent-text outline-none hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
        >
          구경 탭으로
          <ChevronRight className="size-4" strokeWidth={1.8} aria-hidden />
        </Link>
      </div>

      {isLoading ? (
        <PopularShotsSkeleton />
      ) : shots.length > 0 ? (
        <PopularShotsMosaic shots={shots} />
      ) : (
        <div className="flex min-h-28 items-center justify-center rounded-2xl bg-paper-2 px-5 text-center">
          <p className="text-[13px] leading-5 text-ink-2">
            {isError
              ? "때샷을 불러오지 못했어요. 구경 탭에서 다시 확인해 주세요."
              : "아직 소개할 때샷이 없어요. 첫 기록을 기다리고 있어요."}
          </p>
        </div>
      )}
    </section>
  );
}

function PopularShotsMosaic({ shots }: { shots: Shot[] }) {
  if (shots.length === 1) {
    return (
      <PopularShotTile
        shot={shots[0]}
        className="h-40"
        preloadImage
      />
    );
  }

  const left = shots.filter((_, index) => index % 2 === 0);
  const right = shots.filter((_, index) => index % 2 === 1);

  return (
    <div className="grid grid-cols-2 gap-2" aria-label="인기 때샷 모음">
      <div className="flex flex-col gap-2">
        {left.map((shot, index) => (
          <PopularShotTile
            key={shot.id}
            shot={shot}
            preloadImage={index === 0}
            className={
              left.length === 1
                ? "h-[12.5rem]"
                : index === 0
                  ? "h-28"
                  : "h-20"
            }
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {right.map((shot, index) => (
          <PopularShotTile
            key={shot.id}
            shot={shot}
            className={
              right.length === 1
                ? "h-[12.5rem]"
                : index === 0
                  ? "h-20"
                  : "h-28"
            }
          />
        ))}
      </div>
    </div>
  );
}

function PopularShotTile({
  shot,
  className,
  preloadImage = false,
}: {
  shot: Shot;
  className: string;
  preloadImage?: boolean;
}) {
  const src = shot.images[0];

  return (
    <Link
      href={getShotHref(shot)}
      aria-label={`${shot.destinationCity} 인기 때샷 보기, 좋아요 ${shot.likeCount}개`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl bg-paper-3 outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        className,
      )}
    >
      <Image
        src={src}
        alt={`${shot.destinationCity} 때샷`}
        fill
        sizes="(max-width: 480px) calc((100dvw - 2.5rem) / 2), 216px"
        unoptimized={src.startsWith("data:") || src.startsWith("blob:")}
        preload={preloadImage}
        className="object-cover transition-transform duration-200 ease-[var(--ease-out)] group-hover:scale-[1.02]"
      />
      <span className="absolute right-2 bottom-2 left-2 truncate rounded-lg bg-ink/80 px-2 py-1.5 text-[12px] font-semibold text-paper">
        {shot.destinationCity}
      </span>
    </Link>
  );
}

function PopularShotsSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-2"
      role="status"
      aria-label="인기 때샷을 불러오는 중"
    >
      <div className="space-y-2">
        <span className="block h-28 rounded-2xl bg-paper-2" />
        <span className="block h-20 rounded-2xl bg-paper-2" />
      </div>
      <div className="space-y-2">
        <span className="block h-20 rounded-2xl bg-paper-2" />
        <span className="block h-28 rounded-2xl bg-paper-2" />
      </div>
    </div>
  );
}

function getShotHref(shot: Shot) {
  const params = new URLSearchParams({
    city: shot.destinationCity,
    country: shot.destinationCountry,
    source: "hot",
    sort: "likes",
  });
  return `/shots?${params.toString()}#${shot.id}`;
}

function getRecentPopularShots(shots: Shot[], limit = 4) {
  const ranked = queryShots(
    shots.filter((shot) => Boolean(shot.images[0])),
    { channel: "shots", sort: "likes" },
  );
  const recentCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = ranked.filter(
    (shot) => new Date(shot.createdAt).getTime() >= recentCutoff,
  );
  const recentIds = new Set(recent.map((shot) => shot.id));

  return [
    ...recent,
    ...ranked.filter((shot) => !recentIds.has(shot.id)),
  ].slice(0, limit);
}
