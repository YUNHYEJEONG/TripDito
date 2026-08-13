"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, MapPin, Search } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SheetCloseHeader } from "@/components/common/sheet-close-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POPULAR_DESTINATIONS } from "../constants";
import { searchDestinations } from "../utils/shot-query";
import { cn } from "@/lib/utils";

export type DestinationValue = {
  city: string;
  country: string;
} | null;

export function DestinationFilterSheet({
  open,
  onOpenChange,
  value,
  onSelect,
  destinations = POPULAR_DESTINATIONS,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DestinationValue;
  onSelect: (destination: DestinationValue) => void;
  destinations?: ReadonlyArray<{ city: string; country: string }>;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => searchDestinations(destinations, query),
    [destinations, query],
  );

  function handleSheetOpenChange(nextOpen: boolean) {
    if (!nextOpen) setQuery("");
    onOpenChange(nextOpen);
  }

  function handleSelect(city: string, country: string) {
    onSelect({ city, country });
    handleSheetOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[85dvh] max-w-[480px] rounded-t-2xl"
      >
        <SheetCloseHeader
          title="여행지 선택"
          onClose={() => handleSheetOpenChange(false)}
        />

        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
          <div role="search" className="relative">
            <label htmlFor="shot-destination-search" className="sr-only">
              도시나 국가 검색
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-2"
              strokeWidth={1.8}
              aria-hidden
            />
            <Input
              id="shot-destination-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="도시나 국가 검색"
              className="rounded-full bg-paper-2 pl-9 shadow-none"
            />
          </div>

          {!query.trim() ? (
            <div>
              <h3 className="mb-3 text-[14px] font-bold text-ink">
                전체 여행지
              </h3>
              <div className="flex flex-wrap gap-2">
                {destinations.map((dest) => {
                  const selected =
                    value?.city === dest.city &&
                    value?.country === dest.country;
                  return (
                    <button
                      key={`${dest.country}-${dest.city}`}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => handleSelect(dest.city, dest.country)}
                      className={cn(
                        "min-h-11 rounded-full border px-3 py-2 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                        selected
                          ? "border-ink bg-ink text-paper hover:bg-ink-2 active:bg-ink-2"
                          : "border-rule bg-paper text-ink hover:bg-paper-2 active:bg-paper-3",
                      )}
                    >
                      {dest.city}
                    </button>
                  );
                })}
              </div>
              {value ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-4 w-full"
                  onClick={() => {
                    onSelect(null);
                    handleSheetOpenChange(false);
                  }}
                >
                  필터 초기화
                </Button>
              ) : null}
            </div>
          ) : (
            <ul className="flex flex-col">
              {results.length === 0 ? (
                <li className="py-8 text-center text-[13px] text-ink-2">
                  일치하는 여행지가 없어요
                </li>
              ) : (
                results.map((dest) => (
                  <li key={`${dest.country}-${dest.city}`}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                      onClick={() => handleSelect(dest.city, dest.country)}
                    >
                      <MapPin className="size-5 shrink-0 text-ink-2" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-ink">
                          {dest.city}
                        </span>
                        <span className="block text-[12px] text-ink-2">
                          {dest.country}
                        </span>
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-ink-2" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
