"use client";

import Link from "next/link";
import { BookOpen, Plane } from "lucide-react";
import { useState, type CSSProperties } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Trip } from "@/features/trips/types";
import { withReturnTo } from "@/lib/navigation/return-to";

function todayInKorea() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function stampMonth(dateKey: string) {
  const [year, month] = dateKey.split("-");
  return `${year}.${month}`;
}

function tripDuration(startDate: string, endDate: string) {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  const nights = Math.max(0, Math.round((end - start) / 86_400_000));
  return nights === 0 ? "당일" : `${nights}박 ${nights + 1}일`;
}

function completedTrips(trips: Trip[], todayKey: string) {
  return trips
    .filter((trip) => trip.endDate < todayKey)
    .toSorted((a, b) => b.endDate.localeCompare(a.endDate));
}

function tripLinkLabel(trip: Trip) {
  return `${trip.city}, 완료한 여행, ${stampMonth(trip.endDate)}, ${tripDuration(trip.startDate, trip.endDate)}`;
}

const stampStyles = [
  "min-h-[106px] -rotate-[4deg] rounded-full border-[#9f3e36] text-[#8b342f]",
  "min-h-[88px] rotate-[2deg] rounded-[10px] border-[#315f78] text-[#315f78]",
  "min-h-[96px] -rotate-[1deg] rounded-[16px] border-[#617244] text-[#56673d]",
  "min-h-[104px] rotate-[4deg] rounded-full border-[#a85f29] text-[#965326]",
] as const;

const previewStampStyles = [
  "size-[62px] -rotate-[6deg] rounded-full border-[#9f3e36] text-[#8b342f]",
  "h-[54px] w-[70px] rotate-[2deg] rounded-[7px] border-[#315f78] text-[#315f78]",
  "size-[58px] rotate-[5deg] rounded-full border-[#617244] text-[#56673d]",
] as const;

const pageStyle: CSSProperties = {
  backgroundColor: "#fbf5e6",
  backgroundImage:
    "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(112, 91, 62, 0.1) 31px, rgba(112, 91, 62, 0.1) 32px)",
};

function DecorativePreview({ trips }: { trips: Trip[] }) {
  const previewTrips = trips.slice(0, 3);

  return (
    <span
      aria-hidden
      className="relative flex min-h-[132px] flex-col overflow-hidden rounded-2xl border border-[#c9b788] bg-[#f8efd9] px-4 py-3 text-[#493d30] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.58)]"
    >
      <span className="flex items-center justify-between border-b border-[#c9b788]/70 pb-2">
        <span className="text-[10px] font-extrabold tracking-[0.18em]">
          TRAVEL PASSPORT
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold">
          <BookOpen className="size-4" strokeWidth={1.7} />
          여권 열기
        </span>
      </span>

      {previewTrips.length > 0 ? (
        <span className="relative mt-2 grid flex-1 grid-cols-3 items-center gap-1">
          <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-[#9f8b67]/45" />
          {previewTrips.map((trip, index) => (
            <span
              key={trip.id}
              className={`relative z-10 mx-auto flex flex-col items-center justify-center border bg-[#f8efd9] p-1 text-center opacity-85 ${previewStampStyles[index % previewStampStyles.length]}`}
            >
              <span className="max-w-full truncate text-[10px] leading-3 font-extrabold tracking-[-0.03em]">
                {trip.city}
              </span>
              <span className="text-[7px] leading-3 font-bold tabular-nums">
                {stampMonth(trip.endDate)}
              </span>
            </span>
          ))}
        </span>
      ) : (
        <span className="flex flex-1 items-center gap-3 py-3">
          <span className="flex size-12 -rotate-[6deg] items-center justify-center rounded-full border border-[#9f3e36]/55 text-[#9f3e36]/65">
            <Plane className="size-5 rotate-[35deg]" strokeWidth={1.5} />
          </span>
          <span className="text-left">
            <span className="block text-[14px] font-bold">
              첫 여행 도장을 기다리고 있어요
            </span>
            <span className="mt-0.5 block text-[11px] text-[#756550]">
              여행을 마치면 여권에 자동으로 기록돼요.
            </span>
          </span>
        </span>
      )}

      {trips.length > 0 ? (
        <span className="mt-1 text-right text-[10px] font-semibold text-[#756550]">
          완료한 여행 {trips.length}개
        </span>
      ) : null}
    </span>
  );
}

function PassportPage({
  trips,
  startIndex,
  pageNumber,
  showEmptyMessage = false,
  onNavigate,
}: {
  trips: Trip[];
  startIndex: number;
  pageNumber: number;
  showEmptyMessage?: boolean;
  onNavigate: () => void;
}) {
  return (
    <div
      className="relative min-w-0 px-2.5 pt-4 pb-9 first:pr-4 last:pl-4"
      style={pageStyle}
    >
      {trips.length > 0 ? (
        <ol className="flex flex-col items-center gap-5">
          {trips.map((trip, index) => {
            const stampIndex = startIndex + index;
            const style = stampStyles[stampIndex % stampStyles.length];

            return (
              <li key={trip.id} className="flex w-full justify-center">
                <Link
                  href={withReturnTo(`/trips/${trip.id}`, "/profile")}
                  aria-label={tripLinkLabel(trip)}
                  onClick={onNavigate}
                  className={`flex w-full max-w-[130px] flex-col items-center justify-center border-2 bg-[#fbf5e6]/95 p-1 text-center outline-none transition-transform duration-120 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf5e6] motion-reduce:transition-none ${style}`}
                >
                  <span className="flex size-full min-h-[78px] flex-col items-center justify-center rounded-[inherit] border border-current/55 px-1.5 py-2">
                    <span className="text-[8px] leading-3 font-black tracking-[0.14em]">
                      ARRIVED
                    </span>
                    <strong className="mt-0.5 max-w-full truncate text-[13px] leading-4 font-extrabold tracking-[-0.04em]">
                      {trip.city}
                    </strong>
                    <span className="max-w-full truncate text-[8px] leading-3 font-bold tracking-[0.06em]">
                      {trip.country}
                    </span>
                    <time
                      dateTime={trip.endDate}
                      className="mt-1 text-[9px] leading-3 font-extrabold tabular-nums"
                    >
                      {stampMonth(trip.endDate)}
                    </time>
                    <span className="text-[8px] leading-3 font-semibold">
                      {tripDuration(trip.startDate, trip.endDate)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div
          aria-hidden={!showEmptyMessage || undefined}
          className="flex min-h-48 flex-col items-center justify-center text-center text-[#766954]"
        >
          <span className="flex size-20 -rotate-[5deg] items-center justify-center rounded-full border border-[#9f3e36]/40 text-[#9f3e36]/55">
            <span className="flex size-16 items-center justify-center rounded-full border border-[#9f3e36]/30">
              <Plane
                className="size-7 rotate-[35deg]"
                strokeWidth={1.4}
                aria-hidden
              />
            </span>
          </span>
          {showEmptyMessage ? (
            <>
              <p className="mt-4 text-[13px] font-bold text-[#493d30]">
                아직 찍힌 도장이 없어요
              </p>
              <p className="mt-1 max-w-32 text-[10px] leading-4">
                여행을 마치면 이 페이지에 추억이 남아요.
              </p>
            </>
          ) : (
            <span className="mt-3 text-[9px] font-bold tracking-[0.18em]">
              MORE JOURNEYS
            </span>
          )}
        </div>
      )}

      <span
        aria-hidden
        className="absolute right-3 bottom-2 text-[9px] font-semibold text-[#8f8068] tabular-nums"
      >
        {pageNumber}
      </span>
    </div>
  );
}

function PassportNotebook({
  trips,
  onNavigate,
}: {
  trips: Trip[];
  onNavigate: () => void;
}) {
  const midpoint = Math.ceil(trips.length / 2);
  const leftTrips = trips.slice(0, midpoint);
  const rightTrips = trips.slice(midpoint);

  return (
    <DialogContent
      className="h-[min(82dvh,680px)] w-[calc(100vw-1rem)] max-w-[460px] gap-0 overflow-hidden rounded-[22px] border border-[#241b15] bg-[#3e3025] p-2 text-[#493d30] shadow-[0_18px_48px_rgba(25,20,16,0.34)] [rotate:0deg] [scale:1] transition-[opacity,scale,rotate] duration-300 ease-[var(--ease-out)] data-open:animate-none data-closed:animate-none data-starting-style:opacity-0 data-starting-style:[rotate:-2deg] data-starting-style:[scale:.92] data-ending-style:opacity-0 data-ending-style:[rotate:1deg] data-ending-style:[scale:.96] motion-reduce:transition-none motion-reduce:data-starting-style:opacity-100 motion-reduce:data-starting-style:[rotate:0deg] motion-reduce:data-starting-style:[scale:1] motion-reduce:data-ending-style:opacity-100 motion-reduce:data-ending-style:[rotate:0deg] motion-reduce:data-ending-style:[scale:1] sm:max-w-[460px] [&_[data-slot=dialog-close]]:top-2.5 [&_[data-slot=dialog-close]]:right-2.5 [&_[data-slot=dialog-close]]:z-30 [&_[data-slot=dialog-close]]:bg-[#3e3025] [&_[data-slot=dialog-close]]:text-[#f5e6bd] [&_[data-slot=dialog-close]]:shadow-sm [&_[data-slot=dialog-close]]:hover:bg-[#2f241c]"
    >
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[15px] border border-[#d5c49d] bg-[#fbf5e6] shadow-[inset_0_0_20px_rgba(92,69,40,0.12)]">
        <header className="relative shrink-0 border-b border-[#cfc09f] bg-[#f5ead2] px-4 pt-4 pb-3 pr-13">
          <p
            aria-hidden
            className="text-[8px] font-black tracking-[0.22em] text-[#8b795d]"
          >
            DITO TRAVEL DOCUMENT
          </p>
          <DialogTitle className="mt-1 font-heading text-[18px] leading-6 font-extrabold tracking-[-0.03em] text-[#3d3329]">
            나의 여행 여권
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-[11px] leading-4 text-[#74644f]">
            {trips.length > 0
              ? `완료한 여행 ${trips.length}개의 도장이 찍혀 있어요. 도장을 눌러 여행 기록을 열어보세요.`
              : "여행을 다녀오면 이 노트에 도장이 찍혀요."}
          </DialogDescription>
        </header>

        <div className="relative min-h-0 flex-1">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-5 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(85,65,40,0.12),rgba(255,255,255,0.55),rgba(85,65,40,0.14),transparent)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-px -translate-x-1/2 bg-[#aa9876]/65"
          />

          <div className="size-full overflow-y-auto overscroll-contain">
            <div className="grid min-h-full grid-cols-2">
              <PassportPage
                trips={leftTrips}
                startIndex={0}
                pageNumber={1}
                showEmptyMessage={trips.length === 0}
                onNavigate={onNavigate}
              />
              <PassportPage
                trips={rightTrips}
                startIndex={midpoint}
                pageNumber={2}
                onNavigate={onNavigate}
              />
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

export function PassportHistory({ trips }: { trips: Trip[] }) {
  const [passportOpen, setPassportOpen] = useState(false);
  const archivedTrips = completedTrips(trips, todayInKorea());

  return (
    <section aria-labelledby="travel-history-title">
      <h2
        id="travel-history-title"
        className="mb-2 text-[18px] font-bold tracking-[-0.02em] text-foreground"
      >
        여행 기록
      </h2>

      <Dialog open={passportOpen} onOpenChange={setPassportOpen}>
        <DialogTrigger
          render={
            <button
              type="button"
              aria-label={`여행 기록 여권 열기${archivedTrips.length > 0 ? `, 완료한 여행 ${archivedTrips.length}개` : ""}`}
              className="block w-full rounded-2xl text-left outline-none transition-transform duration-120 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 motion-reduce:transition-none"
            />
          }
        >
          <DecorativePreview trips={archivedTrips} />
        </DialogTrigger>

        <PassportNotebook
          trips={archivedTrips}
          onNavigate={() => setPassportOpen(false)}
        />
      </Dialog>
    </section>
  );
}
