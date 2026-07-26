"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import { POPULAR_DESTINATIONS } from "@/features/destinations/constants";
import { FLIGHT_DESTINATIONS } from "@/features/destinations/constants";
import { searchDestinations } from "@/features/shots/utils/shot-query";
import { cn } from "@/lib/utils";
import {
  MAX_TRIP_TAGS,
  TRIP_TAG_OPTIONS,
  type TripTagId,
} from "../constants/trip-tags";

export type TripDestination = {
  city: string;
  country: string;
};

export function TripDestinationStep({
  value,
  onChange,
  tripTags,
  onTripTagsChange,
  onNext,
}: {
  value: TripDestination | null;
  onChange: (destination: TripDestination) => void;
  tripTags: TripTagId[];
  onTripTagsChange: (tags: TripTagId[]) => void;
  onNext: () => void;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => searchDestinations(FLIGHT_DESTINATIONS, query),
    [query],
  );

  function toggleTag(id: TripTagId) {
    if (tripTags.includes(id)) {
      onTripTagsChange(tripTags.filter((tag) => tag !== id));
      return;
    }
    if (tripTags.length >= MAX_TRIP_TAGS) return;
    onTripTagsChange([...tripTags, id]);
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="여행지를 검색해보세요"
        className="[&_input]:rounded-full [&_input]:bg-[#F2F4F6]"
      />

      {!query.trim() ? (
        <div>
          <h3 className="mb-3 text-[14px] font-bold text-foreground">
            인기 지역
          </h3>
          <div className="flex flex-wrap gap-2">
            {POPULAR_DESTINATIONS.map((dest) => {
              const selected =
                value?.city === dest.city && value?.country === dest.country;
              return (
                <button
                  key={`${dest.country}-${dest.city}`}
                  type="button"
                  onClick={() =>
                    onChange({ city: dest.city, country: dest.country })
                  }
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-[#E5E8EB] bg-background text-foreground hover:bg-[#F2F4F6]",
                  )}
                >
                  {dest.city}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <ul className="flex flex-col">
          {results.length === 0 ? (
            <li className="py-8 text-center text-[13px] text-muted-foreground">
              검색 결과가 없습니다
            </li>
          ) : (
            results.map((dest) => {
              const selected =
                value?.city === dest.city && value?.country === dest.country;
              return (
                <li key={`${dest.country}-${dest.city}`}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 py-3 text-left",
                      selected && "bg-primary/5",
                    )}
                    onClick={() =>
                      onChange({ city: dest.city, country: dest.country })
                    }
                  >
                    <MapPin className="size-5 shrink-0 text-[#848C94]" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-primary">
                        {dest.city}
                      </span>
                      <span className="block text-[12px] text-[#848C94]">
                        {dest.country}
                      </span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-[#848C94]" />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}

      <div>
        <h3 className="mb-1 text-[14px] font-bold text-foreground">
          어떤 여행인가요?
        </h3>
        <p className="mb-3 text-[12px] text-muted-foreground">
          최대 {MAX_TRIP_TAGS}개까지 선택할 수 있어요 (선택)
        </p>
        <div className="flex flex-wrap gap-2">
          {TRIP_TAG_OPTIONS.map((tag) => {
            const selected = tripTags.includes(tag.id);
            const disabled = !selected && tripTags.length >= MAX_TRIP_TAGS;
            return (
              <button
                key={tag.id}
                type="button"
                disabled={disabled}
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-[#E5E8EB] bg-background text-foreground hover:bg-[#F2F4F6]",
                  disabled && "opacity-40",
                )}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-canvas px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 md:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[480px] md:max-w-[720px] lg:max-w-[960px]">
          <Button
            type="button"
            className="w-full"
            disabled={!value}
            onClick={onNext}
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}
