"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SearchInput } from "@/components/common/search-input";
import { SheetCloseHeader } from "@/components/common/sheet-close-header";
import { Button } from "@/components/ui/button";
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DestinationValue;
  onSelect: (destination: DestinationValue) => void;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => searchDestinations(POPULAR_DESTINATIONS, query),
    [query],
  );

  function handleSelect(city: string, country: string) {
    onSelect({ city, country });
    onOpenChange(false);
    setQuery("");
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[85vh] max-w-[480px] rounded-t-2xl md:max-w-[720px] lg:max-w-[960px]"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#D1D5DB]" />
        <SheetCloseHeader
          title="여행지 선택"
          onClose={() => onOpenChange(false)}
        />

        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
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
                    value?.city === dest.city &&
                    value?.country === dest.country;
                  return (
                    <button
                      key={`${dest.country}-${dest.city}`}
                      type="button"
                      onClick={() => handleSelect(dest.city, dest.country)}
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
              {value ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-4 w-full"
                  onClick={() => {
                    onSelect(null);
                    onOpenChange(false);
                  }}
                >
                  필터 초기화
                </Button>
              ) : null}
            </div>
          ) : (
            <ul className="flex flex-col">
              {results.length === 0 ? (
                <li className="py-8 text-center text-[13px] text-muted-foreground">
                  검색 결과가 없습니다
                </li>
              ) : (
                results.map((dest) => (
                  <li key={`${dest.country}-${dest.city}`}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 py-3 text-left"
                      onClick={() => handleSelect(dest.city, dest.country)}
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
                ))
              )}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
