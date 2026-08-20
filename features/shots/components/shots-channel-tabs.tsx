import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const shotViews = [
  { id: "shots" as const, label: "피드", href: "/shots" },
  {
    id: "ranking" as const,
    label: "잇템 랭킹",
    href: "/shots?tab=ranking",
  },
  {
    id: "community" as const,
    label: "커뮤니티",
    href: "/shots?tab=community",
  },
];

export type ExploreChannel = "shots" | "shopping";
export type ShotsView = (typeof shotViews)[number]["id"];

const channelTitles: Record<ExploreChannel, string> = {
  shots: "때샷",
  shopping: "쇼핑",
};

/**
 * 화면 제목을 따로 두지 않고 **보기 탭이 헤더 자리를 차지한다.** 하단 탭 아이콘이
 * 이미 "때샷"임을 말하고 있어 제목은 같은 말의 반복이었다. 탭은 현재 위치와 이동
 * 가능한 곳을 함께 알려 주므로 같은 높이에서 더 많은 일을 한다.
 * 보기 탭이 없는 채널(쇼핑)은 제목을 그대로 둔다 — 대신할 것이 없으면 비우지 않는다.
 */
export function ShotsChannelTabs({
  active,
  shotView,
  actions,
}: {
  active: ExploreChannel;
  shotView?: ShotsView;
  actions?: ReactNode;
}) {
  const showsViewTabs = active === "shots" && Boolean(shotView);

  return (
    <header
      className={cn(
        "sticky top-[env(safe-area-inset-top)] z-30 -mt-3 flex h-12 items-center border-b border-rule bg-paper before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-[env(safe-area-inset-top)] before:bg-paper",
        showsViewTabs ? (actions ? "pr-2" : "") : "gap-3 px-4",
      )}
    >
      {showsViewTabs ? (
        <>
          <h1 className="sr-only">{channelTitles[active]}</h1>
          {/**
           * 개수가 3개로 고정이므로 Material의 **fixed 탭** 규격을 따른다 —
           * 폭 = 컨테이너 ÷ 탭 수, 화면 전체를 균등 분할. 글자 폭에 맞춰 왼쪽으로
           * 몰아 두는 건 탭이 많거나 가변일 때 쓰는 scrollable 규격이라 여기선 틀리다.
           * 위치가 항상 같아야 근육 기억이 생기고, 터치 영역도 1/3씩 넓게 잡힌다.
           */}
          <nav
            aria-label="때샷 보기"
            className="flex h-12 min-w-0 flex-1 items-stretch"
          >
            {shotViews.map((view) => {
              const selected = shotView === view.id;
              return (
                <Link
                  key={view.id}
                  href={view.href}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "relative inline-flex h-12 min-w-0 flex-1 items-center justify-center px-2 text-[15px] leading-5 whitespace-nowrap outline-none transition-colors duration-120 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-transparent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus motion-reduce:transition-none",
                    selected
                      ? "font-bold text-accent-text after:bg-accent-text"
                      : "font-medium text-ink-2 hover:text-ink active:text-ink",
                  )}
                >
                  {view.label}
                </Link>
              );
            })}
          </nav>
        </>
      ) : (
        <h1 className="min-w-0 flex-1 text-[20px] font-bold tracking-[-0.025em] text-ink">
          {channelTitles[active]}
        </h1>
      )}

      {actions ? (
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      ) : null}
    </header>
  );
}
