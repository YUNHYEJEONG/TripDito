"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  ChevronUp,
  Luggage,
  MapPin,
  PlaneTakeoff,
  Stamp,
} from "lucide-react";
import type { HomeMode } from "@/features/home/utils/get-home-mode";
import { todayIsoDate } from "@/features/home/utils/get-upcoming-trip";
import {
  getHomeTripDockViewModel,
  HOME_NEW_TRIP_HREF,
  HOME_TRIP_DOCK_SCROLL_THRESHOLD_PX,
  type HomeTripDockIconKey,
  type HomeTripDockMetrics,
  type HomeTripDockState,
} from "@/features/home/utils/home-trip-dock";
import type { Trip } from "@/features/trips/types";
import { cn } from "@/lib/utils";

const stateVisuals = {
  none: {
    accent: "bg-ink-3",
    icon: "bg-paper-2 text-ink",
    metric: "text-ink",
  },
  idle: {
    accent: "bg-ink",
    icon: "bg-ink text-paper",
    metric: "text-ink",
  },
  prep: {
    accent: "bg-prep-deep",
    icon: "bg-prep text-prep-deep",
    metric: "text-prep-deep",
  },
  live: {
    accent: "bg-live-deep",
    icon: "bg-live text-live-deep",
    metric: "text-live-deep",
  },
  after: {
    accent: "bg-after-deep",
    icon: "bg-after text-after-deep",
    metric: "text-after-deep",
  },
} satisfies Record<
  HomeTripDockState,
  { accent: string; icon: string; metric: string }
>;

const stateIcons = {
  empty: Luggage,
  calendar: CalendarDays,
  plane: PlaneTakeoff,
  location: MapPin,
  stamp: Stamp,
} satisfies Record<HomeTripDockIconKey, typeof CalendarDays>;

function useDockCompactState() {
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      setCompact(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return { compact, sentinelRef };
}

type DockView = ReturnType<typeof getHomeTripDockViewModel>;

function DockContext({ view, compact }: { view: DockView; compact: boolean }) {
  const visual = stateVisuals[view.state];
  const Icon = stateIcons[view.iconKey];
  const cityLabel = view.state === "none" ? "내 여행" : view.cityLabel;

  return (
    <span
      aria-hidden
      className="grid min-w-0 flex-1 grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2"
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 ease-out motion-reduce:transition-none",
          compact && "-translate-y-2",
          visual.icon,
        )}
      >
        <Icon className="size-[18px]" strokeWidth={2} />
      </span>

      <span className="min-w-0">
        <span
          className={cn(
            "block truncate text-[11px] leading-4 font-semibold text-ink-2 transition-opacity duration-200 ease-out motion-reduce:transition-none",
            compact && "opacity-0",
          )}
        >
          {view.statusLabel}
        </span>
        <strong
          className={cn(
            "block truncate text-[17px] leading-5 font-bold tracking-[-0.02em] text-ink transition-transform duration-200 ease-out motion-reduce:transition-none",
            compact && "-translate-y-4",
          )}
        >
          {cityLabel}
        </strong>
      </span>

      {view.metricValue ? (
        <span className="min-w-[46px] shrink-0 text-right">
          <strong
            className={cn(
              "block whitespace-nowrap text-[22px] leading-none font-bold tracking-[-0.04em] tabular-nums transition-transform duration-200 ease-out motion-reduce:transition-none",
              compact && "translate-y-0.5",
              visual.metric,
            )}
          >
            {view.metricValue}
          </strong>
          <span
            className={cn(
              "mt-1 block whitespace-nowrap text-[11px] leading-4 font-medium text-ink-2 transition-opacity duration-200 ease-out motion-reduce:transition-none",
              compact && "opacity-0",
            )}
          >
            {view.metricCaption}
          </span>
        </span>
      ) : null}
    </span>
  );
}

export function HomeTripDock({
  trip,
  mode,
  today = todayIsoDate(),
  metrics,
  onOpenTripSwitcher,
}: {
  trip: Trip | null;
  mode: HomeMode;
  today?: string;
  metrics?: HomeTripDockMetrics;
  onOpenTripSwitcher: () => void;
}) {
  const { compact, sentinelRef } = useDockCompactState();
  const view = getHomeTripDockViewModel(trip, mode, today, metrics);
  const visual = stateVisuals[view.state];

  return (
    <>
      <span
        ref={sentinelRef}
        aria-hidden
        className="pointer-events-none absolute left-0 size-px opacity-0"
        style={{ top: HOME_TRIP_DOCK_SCROLL_THRESHOLD_PX }}
      />
      <aside
        data-home-trip-dock=""
        data-compact={compact ? "true" : "false"}
        data-state={view.state}
        aria-label="홈 여행 도크"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom)+0.75rem)] z-30"
      >
        <div className="mx-auto h-[72px] w-full max-w-[var(--app-rail-max)] px-[var(--app-gutter)]">
          <div className="relative h-full overflow-hidden rounded-2xl">
            <span
              aria-hidden
              className={cn(
                "absolute inset-0 origin-bottom rounded-2xl border border-rule bg-paper shadow-float transition-transform duration-200 ease-out motion-reduce:transition-none",
                compact && "translate-y-4",
              )}
            />
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 top-0 h-[3px] transition-transform duration-200 ease-out motion-reduce:transition-none",
                compact && "translate-y-4",
                visual.accent,
              )}
            />

            <div
              className={cn(
                "pointer-events-auto absolute inset-x-0 bottom-0 flex h-[72px] overflow-hidden rounded-2xl text-left transition-transform duration-200 ease-out motion-reduce:transition-none",
                compact && "translate-y-4",
              )}
            >
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={view.ariaLabel}
                onClick={onOpenTripSwitcher}
                className="relative flex min-w-0 flex-1 items-center gap-1.5 px-2.5 text-left outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset active:scale-[0.99]"
              >
                <DockContext view={view} compact={compact} />
                <ChevronUp
                  className={cn(
                    "size-4 shrink-0 text-ink-2 transition-transform duration-200 ease-out motion-reduce:transition-none",
                    compact && "-translate-y-2",
                  )}
                  strokeWidth={2}
                  aria-hidden
                />
              </button>

              <Link
                href={HOME_NEW_TRIP_HREF}
                aria-label="새 여행 만들기"
                className="flex w-12 shrink-0 items-center justify-center border-l border-rule bg-paper-2 text-ink outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset hover:bg-paper-3 active:bg-paper-3 active:scale-[0.97]"
              >
                <CalendarPlus
                  className={cn(
                    "size-[21px] transition-transform duration-200 ease-out motion-reduce:transition-none",
                    compact && "-translate-y-2",
                  )}
                  strokeWidth={2}
                  aria-hidden
                />
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
