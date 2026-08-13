"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  MapPin,
  Search,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DEMO_MAP_PLACES,
  type DemoMapPlace,
} from "@/features/map/data/demo-map-places";
import { cn } from "@/lib/utils";

function matchesQuery(place: DemoMapPlace, rawQuery: string) {
  const query = rawQuery.trim().toLocaleLowerCase("ko-KR");
  if (!query) return true;
  return [place.name, place.city, place.address, place.category, ...place.searchTerms]
    .join(" ")
    .toLocaleLowerCase("ko-KR")
    .includes(query);
}

export function DemoMapExplorer({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const visiblePlaces = useMemo(
    () => DEMO_MAP_PLACES.filter((place) => matchesQuery(place, deferredQuery)),
    [deferredQuery],
  );
  const selectedPlace =
    DEMO_MAP_PLACES.find((place) => place.id === selectedId) ?? null;

  function selectPlace(place: DemoMapPlace) {
    setSelectedId(place.id);
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#edf1ed]">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[8%] left-[-18%] h-6 w-[150%] rotate-[18deg] bg-paper/85 shadow-[0_0_0_1px_rgb(139_149_161/0.12)]" />
        <div className="absolute top-[34%] left-[-20%] h-8 w-[150%] -rotate-[12deg] bg-paper/85 shadow-[0_0_0_1px_rgb(139_149_161/0.12)]" />
        <div className="absolute top-[-12%] left-[48%] h-[100%] w-7 rotate-[7deg] bg-paper/85 shadow-[0_0_0_1px_rgb(139_149_161/0.12)]" />
        <div className="absolute top-0 left-[12%] h-[70%] w-3 -rotate-[18deg] bg-paper/70" />
        <div className="absolute top-[16%] left-[58%] size-24 rounded-2xl bg-[#dce8dc]" />
        <div className="absolute top-[47%] left-[5%] size-20 rounded-xl bg-[#e4e9e2]" />
        <div className="absolute top-[30%] right-[3%] h-28 w-16 rounded-xl bg-[#dfe9df]" />
      </div>

      <div className="absolute top-3 right-3 left-3 z-20">
        <div className="flex h-12 items-center gap-2 rounded-2xl bg-paper px-3 shadow-float focus-within:ring-2 focus-within:ring-focus">
          <Search className="size-5 shrink-0 text-ink-2" aria-hidden />
          <label htmlFor="demo-map-search" className="sr-only">
            데모 장소 검색
          </label>
          <input
            id="demo-map-search"
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="장소나 카테고리 검색"
            className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
          />
          {query ? (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => setQuery("")}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-2 outline-none hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
        <p className="mx-auto mt-2 w-fit rounded-full bg-ink/75 px-3 py-1 text-[11px] font-semibold text-paper">
          지도 연결 전 · 데모 장소
        </p>
      </div>

      {visiblePlaces.map((place) => {
        const selected = selectedId === place.id;
        return (
          <button
            key={place.id}
            type="button"
            aria-label={`${place.name}, ${place.category}`}
            aria-pressed={selected}
            onClick={() => selectPlace(place)}
            className={cn(
              "absolute z-10 flex min-h-11 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold shadow-float outline-none transition-[color,background-color,transform] duration-120 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
              selected
                ? "scale-110 bg-accent-text text-paper"
                : "bg-paper text-ink active:scale-95",
            )}
            style={{ left: `${place.mapPosition.x}%`, top: `${place.mapPosition.y}%` }}
          >
            <MapPin className="size-4" fill="currentColor" aria-hidden />
            <span className="max-w-20 truncate">{place.markerLabel}</span>
          </button>
        );
      })}

      <section
        aria-label={selectedPlace ? "선택한 장소" : "주변 추천 장소"}
        className="absolute right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-30 flex max-h-[45dvh] flex-col overflow-hidden rounded-2xl bg-paper shadow-float"
      >
        {selectedPlace ? (
          <PlaceDetail
            place={selectedPlace}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <>
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-[17px] font-bold text-ink">주변 추천</h2>
              <p className="mt-0.5 text-[12px] leading-5 text-ink-2">
                장소를 누르면 쇼핑 정보와 외부 지도 링크를 확인할 수 있어요.
              </p>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {visiblePlaces.length > 0 ? (
                visiblePlaces.map((place) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      onClick={() => selectPlace(place)}
                      className="flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2 text-left outline-none hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-paper-2 text-accent-text">
                        <MapPin className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold text-ink">
                          {place.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-ink-2">
                          {place.category} · {place.address}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] font-semibold text-ink-2 tabular-nums">
                        {place.rating.toFixed(1)}
                      </span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-8 text-center">
                  <p className="text-[14px] font-semibold text-ink">
                    일치하는 데모 장소가 없어요
                  </p>
                  <button
                    type="button"
                    className="mt-2 min-h-11 px-3 text-[13px] font-semibold text-accent-text"
                    onClick={() => setQuery("")}
                  >
                    검색 초기화
                  </button>
                </li>
              )}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function PlaceDetail({
  place,
  onClose,
}: {
  place: DemoMapPlace;
  onClose: () => void;
}) {
  const externalMapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${place.name} ${place.address}`,
  )}`;

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-accent-text">
            {place.city} · {place.category}
          </p>
          <h2 className="mt-1 text-[19px] leading-7 font-bold text-ink">
            {place.name}
          </h2>
          <p className="mt-0.5 text-[12px] text-ink-2">{place.address}</p>
        </div>
        <button
          type="button"
          aria-label="장소 정보 닫기"
          onClick={onClose}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-paper-2 text-ink outline-none hover:bg-paper-3 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <p className="mt-3 text-[13px] leading-5 text-ink-2">{place.summary}</p>
      <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-ink">
        <Star className="size-4 fill-star" aria-hidden />
        데모 평점 {place.rating.toFixed(1)}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={`/shopping?q=${encodeURIComponent(place.name)}`}
          className={buttonVariants({ variant: "secondary" })}
        >
          <ShoppingBag className="size-4" aria-hidden />
          쇼핑 정보
        </Link>
        <a
          href={externalMapHref}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants()}
        >
          외부 지도
          <ArrowUpRight className="size-4" aria-hidden />
          <span className="sr-only">새 창</span>
        </a>
      </div>
    </div>
  );
}
