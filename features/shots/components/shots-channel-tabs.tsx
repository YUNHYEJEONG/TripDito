"use client";

import { cn } from "@/lib/utils";

const tabs = [
  { id: "shots" as const, label: "때샷구경" },
  { id: "item-ranking" as const, label: "잇템 랭킹" },
  { id: "community" as const, label: "커뮤니티" },
];

/** 잇템 랭킹 활성 탭 강조색 */
const RANKING_ACTIVE = "#E03131";

export type ShotsTab = (typeof tabs)[number]["id"];

export function ShotsChannelTabs({
  value,
  onChange,
}: {
  value: ShotsTab;
  onChange: (tab: ShotsTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="때샷 채널"
      className="flex items-center justify-start gap-5 px-4 pt-1.5 pb-0.5 sm:px-5 md:px-6 lg:px-8"
    >
      {tabs.map((tab) => {
        const active = value === tab.id;
        const rankingAccent = tab.id === "item-ranking" && active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "shrink-0 text-[16px] transition-colors",
              active ? "font-bold" : "font-medium text-[#848C94]",
              active && !rankingAccent && "text-primary",
            )}
            style={rankingAccent ? { color: RANKING_ACTIVE } : undefined}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
