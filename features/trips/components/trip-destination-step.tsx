"use client";

import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import {
  destinationsForRegion,
  popularDestinationsForRegion,
  type TripRegion,
} from "@/features/destinations/constants";
import { searchDestinations } from "@/features/shots/utils/shot-query";
import { cn } from "@/lib/utils";
import {
  MAX_TRIP_TAGS,
  TRIP_TAG_OPTIONS,
  type TripTagId,
} from "../constants/trip-tags";

export type TripDestination = { city: string; country: string };

export function TripDestinationStep({
  region,
  value,
  onChange,
  tripTags,
  onTripTagsChange,
  onNext,
  onBack,
}: {
  region: TripRegion;
  value: TripDestination | null;
  onChange: (value: TripDestination) => void;
  tripTags: TripTagId[];
  onTripTagsChange: (value: TripTagId[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const catalog = useMemo(() => destinationsForRegion(region), [region]);
  const popular = useMemo(() => popularDestinationsForRegion(region), [region]);
  const results = useMemo(() => searchDestinations(catalog, query), [catalog, query]);

  function toggleTag(id: TripTagId) {
    if (tripTags.includes(id)) {
      onTripTagsChange(tripTags.filter((tag) => tag !== id));
    } else if (tripTags.length < MAX_TRIP_TAGS) {
      onTripTagsChange([...tripTags, id]);
    }
  }

  return (
    <section aria-labelledby="trip-destination-title" className="mx-auto w-full max-w-3xl pb-24">
      <h2 id="trip-destination-title" className="text-[22px] font-bold tracking-[-0.025em] text-ink">
        여행지를 골라 주세요
      </h2>
      <p className="mt-2 text-[14px] leading-5 text-ink-2">
        인기 도시에서 고르거나 국가·도시 이름으로 검색할 수 있어요.
      </p>

      <SearchInput
        value={query}
        onChange={setQuery}
        label="여행지 검색"
        placeholder={region === "domestic" ? "국내 도시 검색" : "국가 또는 도시 검색"}
        className="mt-5"
      />

      {!query.trim() ? (
        <div className="mt-5">
          <h3 className="text-[14px] font-semibold text-ink">
            {region === "domestic" ? "인기 국내 여행지" : "인기 해외 여행지"}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {popular.map((destination) => {
              const selected = value?.city === destination.city && value.country === destination.country;
              return (
                <button
                  key={`${destination.country}-${destination.city}`}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange(destination)}
                  className={cn(
                    "min-h-11 rounded-full border border-rule bg-paper px-4 text-[14px] font-medium text-ink outline-none hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-focus",
                    selected && "border-accent-text bg-paper-2 text-accent-text",
                  )}
                >
                  {destination.city}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <p className="mb-2 text-[12px] text-ink-2" role="status">
            검색 결과 {results.length}개
          </p>
          {results.length ? (
            <ul className="grid gap-2">
              {results.map((destination) => {
                const selected = value?.city === destination.city && value.country === destination.country;
                return (
                  <li key={`${destination.country}-${destination.city}`}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onChange(destination)}
                      className={cn(
                        "flex min-h-14 w-full items-center gap-3 rounded-xl bg-paper-2 px-3 text-left outline-none hover:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus",
                        selected && "ring-2 ring-accent-text",
                      )}
                    >
                      <MapPin className="size-5 shrink-0 text-ink-2" aria-hidden />
                      <span className="min-w-0">
                        <strong className="block truncate text-[15px] font-semibold text-ink">{destination.city}</strong>
                        <span className="block text-[12px] text-ink-2">{destination.country}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-xl bg-paper-2 px-4 py-8 text-center text-[14px] text-ink-2">
              일치하는 여행지가 없어요. 도시 또는 국가 이름을 확인해 주세요.
            </div>
          )}
        </div>
      )}

      <div className="mt-7 border-t border-rule pt-6">
        <h3 className="text-[14px] font-semibold text-ink">어떤 여행인가요?</h3>
        <p className="mt-1 text-[12px] text-ink-2">선택 사항 · 최대 {MAX_TRIP_TAGS}개</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRIP_TAG_OPTIONS.map((tag) => {
            const selected = tripTags.includes(tag.id);
            const disabled = !selected && tripTags.length >= MAX_TRIP_TAGS;
            return (
              <button
                key={tag.id}
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  "min-h-11 rounded-full border border-rule px-4 text-[13px] font-medium text-ink outline-none hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-40",
                  selected && "border-accent-text bg-paper-2 text-accent-text",
                )}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      <WizardActions>
        <Button type="button" variant="secondary" className="flex-1" onClick={onBack}>이전</Button>
        <Button type="button" className="flex-1" disabled={!value} onClick={onNext}>다음</Button>
      </WizardActions>
    </section>
  );
}

export function WizardActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[var(--app-rail-max)] border-t border-rule bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md min-[481px]:border-x">
      <div className="flex w-full gap-2">{children}</div>
    </div>
  );
}
