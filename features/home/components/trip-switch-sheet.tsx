"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, LoaderCircle, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Trip } from "@/features/trips/types";
import {
  TripStatusBadge,
  tripCardStatusFromHomeMode,
} from "@/features/trips/components/trip-card";
import {
  getTripHomeMode,
  type HomeMode,
} from "@/features/home/utils/get-home-mode";
import { todayIsoDate } from "@/features/home/utils/get-upcoming-trip";
import { formatDateRange } from "@/lib/format/date";
import { cn } from "@/lib/utils";

export function TripSwitchSheet({
  trips,
  activeTripId,
  today = todayIsoDate(),
  onSelect,
  children,
}: {
  trips: Trip[];
  activeTripId?: string | null;
  today?: string;
  onSelect: (tripId: string) => void | Promise<void>;
  children: (openSheet: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [selectingTripId, setSelectingTripId] = useState<string | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);
  const groups = [
    {
      key: "live" as const,
      label: "진행 중",
      trips: trips
        .filter((trip) => getTripHomeMode(trip, today) === "live")
        .sort((a, b) => a.endDate.localeCompare(b.endDate)),
    },
    {
      key: "upcoming" as const,
      label: "예정",
      trips: trips
        .filter((trip) => trip.startDate > today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    },
    {
      key: "complete" as const,
      label: "완료",
      trips: trips
        .filter((trip) => trip.endDate < today)
        .sort((a, b) => b.endDate.localeCompare(a.endDate)),
    },
  ];

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSelectError(null);
      }}
    >
      {children(() => setOpen(true))}
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[84dvh] w-full max-w-[480px] overflow-hidden rounded-t-2xl border-rule p-0"
      >
        <SheetHeader className="shrink-0 border-b border-rule px-5 py-4 pr-16">
          <SheetTitle className="text-[18px] font-semibold">내 여행</SheetTitle>
          <SheetDescription className="text-[13px] text-ink-2">
            홈의 쇼핑리스트에 표시할 여행을 선택하세요.
          </SheetDescription>
          {selectError ? (
            <p className="text-[13px] text-danger" role="alert">
              {selectError}
            </p>
          ) : null}
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5">
          {groups.map((group) =>
            group.trips.length ? (
              <section
                key={group.key}
                aria-labelledby={`trip-group-${group.key}`}
              >
                <h3
                  id={`trip-group-${group.key}`}
                  className="px-1 text-[13px] font-semibold text-ink-2"
                >
                  {group.label}
                </h3>
                <ul className="mt-2 divide-y divide-rule">
                  {group.trips.map((trip) => {
                    const mode = getTripHomeMode(trip, today);
                    const active = trip.id === activeTripId;
                    const canSelect = mode !== "idle" || trip.startDate > today;
                    return (
                      <li key={trip.id}>
                        {!canSelect ? (
                          <TripDetailLink trip={trip} />
                        ) : (
                          <button
                            type="button"
                            aria-pressed={active}
                            aria-busy={selectingTripId === trip.id || undefined}
                            disabled={selectingTripId !== null}
                            className="flex min-h-14 w-full items-center gap-3 rounded-lg px-1 py-3 text-left outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
                            onClick={async () => {
                              setSelectError(null);
                              setSelectingTripId(trip.id);
                              try {
                                await onSelect(trip.id);
                                setOpen(false);
                              } catch {
                                setSelectError(
                                  "여행을 바꾸지 못했어요. 다시 시도해 주세요.",
                                );
                              } finally {
                                setSelectingTripId(null);
                              }
                            }}
                          >
                            <TripRow trip={trip} mode={mode} />
                            {selectingTripId === trip.id ? (
                              <LoaderCircle
                                className="size-5 shrink-0 animate-spin text-accent-text motion-reduce:animate-none"
                                aria-hidden
                              />
                            ) : active ? (
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
                                <Check
                                  className="size-4"
                                  strokeWidth={3}
                                  aria-hidden
                                />
                                <span className="sr-only">현재 여행</span>
                              </span>
                            ) : (
                              <ChevronRight
                                className="size-5 shrink-0 text-ink-3"
                                aria-hidden
                              />
                            )}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null,
          )}
        </div>
        <SheetFooter className="grid shrink-0 grid-cols-2 gap-2 border-t border-rule p-4">
          <Link
            href="/passport"
            className="flex min-h-12 items-center justify-center rounded-lg border border-ink px-3 text-center text-[14px] font-semibold text-ink outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            전체 여행 관리
          </Link>
          <Link
            href="/trips/new"
            className="press-overlay flex min-h-12 items-center justify-center gap-1.5 rounded-lg bg-accent-text px-3 text-center text-[14px] font-semibold text-paper outline-none transition-colors duration-120 hover:bg-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
          >
            <Plus className="size-4" aria-hidden />
            새 여행
          </Link>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function TripDetailLink({ trip }: { trip: Trip }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="flex min-h-14 items-center gap-3 rounded-lg px-1 py-3 outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
    >
      <TripRow trip={trip} mode="idle" />
      <ChevronRight className="size-5 shrink-0 text-ink-3" aria-hidden />
    </Link>
  );
}

function TripRow({
  trip,
  mode,
}: {
  trip: Trip;
  mode: HomeMode;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="truncate text-[15px] font-semibold text-ink">{trip.name}</p>
        {/* 배지는 여행 탭 카드와 **같은 컴포넌트**를 쓴다. 정의가 한 곳뿐이라 갈라질 수 없다. */}
        <TripStatusBadge status={tripCardStatusFromHomeMode(mode)} />
      </div>
      <p className="mt-1 truncate text-[13px] text-ink-2">
        {trip.city} · {formatDateRange(trip.startDate, trip.endDate)}
      </p>
    </div>
  );
}
