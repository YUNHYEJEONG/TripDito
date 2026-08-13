"use client";

import { Globe2, MapPinned } from "lucide-react";
import type { TripRegion } from "@/features/destinations/constants";
import { cn } from "@/lib/utils";

const OPTIONS = [
  {
    id: "overseas" as const,
    title: "해외 여행",
    description: "국가와 도시를 고르면 통화를 자동으로 맞춰요.",
    icon: Globe2,
  },
  {
    id: "domestic" as const,
    title: "국내 여행",
    description: "한국의 주요 여행지에서 골라 보세요.",
    icon: MapPinned,
  },
];

export function TripRegionStep({
  value,
  onChange,
}: {
  value: TripRegion | null;
  onChange: (value: TripRegion) => void;
}) {
  return (
    <section aria-labelledby="trip-region-title" className="mx-auto w-full max-w-2xl">
      <h2 id="trip-region-title" className="text-[22px] font-bold tracking-[-0.025em] text-ink">
        어디를 여행하나요?
      </h2>
      <p className="mt-2 text-[14px] leading-5 text-ink-2">
        지역에 맞는 여행지와 통화를 다음 단계에서 안내할게요.
      </p>
      <div className="mt-6 grid gap-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              className={cn(
                "group flex min-h-20 items-center gap-3 rounded-2xl border bg-paper p-4 text-left shadow-card outline-none transition-colors hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                selected ? "border-accent-text bg-paper-2" : "border-rule",
              )}
            >
              <span className={cn("flex size-11 items-center justify-center rounded-xl bg-paper-2 text-ink-2", selected && "bg-accent-text text-paper")}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-[17px] font-semibold text-ink">{option.title}</strong>
                <span className="mt-0.5 block text-[13px] leading-5 text-ink-2">{option.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
