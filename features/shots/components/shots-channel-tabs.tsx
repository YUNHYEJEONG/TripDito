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

/** 하단 탭과 중복되지 않는 모바일 화면 제목 + 때샷 내부 보기. */
export function ShotsChannelTabs({
  active,
  shotView,
  actions,
}: {
  active: ExploreChannel;
  shotView?: ShotsView;
  actions?: ReactNode;
}) {
  return (
    <>
      <header className="sticky top-[env(safe-area-inset-top)] z-30 -mt-3 flex h-12 items-center border-b border-rule bg-paper px-4 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-[env(safe-area-inset-top)] before:bg-paper">
        <h1 className="min-w-0 flex-1 text-[20px] font-bold tracking-[-0.025em] text-ink">
          {active === "shots" && shotView === "ranking"
            ? "잇템 랭킹"
            : channelTitles[active]}
        </h1>

        {actions ? (
          <div className="flex h-11 shrink-0 items-center gap-1">{actions}</div>
        ) : null}
      </header>

      {active === "shots" && shotView ? (
        <nav
          aria-label="때샷 보기"
          className="mx-auto flex h-11 w-full max-w-[480px] border-b border-rule bg-paper px-2"
        >
          {shotViews.map((view) => {
            const selected = shotView === view.id;
            return (
              <Link
                key={view.id}
                href={view.href}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-sm px-1 text-[14px] outline-none transition-colors duration-120 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                  selected
                    ? "font-bold text-ink after:bg-ink"
                    : "font-medium text-ink-2 hover:text-ink active:text-ink",
                )}
              >
                {view.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}
