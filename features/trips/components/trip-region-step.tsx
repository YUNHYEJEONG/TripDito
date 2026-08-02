"use client";

import { Globe2, MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripRegion } from "@/features/destinations/constants";

const OPTIONS: {
  id: TripRegion;
  title: string;
  description: string;
  icon: typeof Globe2;
}[] = [
  {
    id: "overseas",
    title: "해외",
    description: "해외 여행지를 선택해요",
    icon: Globe2,
  },
  {
    id: "domestic",
    title: "국내",
    description: "국내 주요 관광 시를 선택해요",
    icon: MapPinned,
  },
];

export function TripRegionStep({
  value,
  onChange,
}: {
  value: TripRegion | null;
  onChange: (region: TripRegion) => void;
}) {
  return (
    <div className="flex flex-col gap-4 pb-8">
      <div>
        <h2 className="text-[17px] font-bold text-foreground">
          어디를 여행하나요?
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          해외와 국내 중 하나를 선택해 주세요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((option) => {
          const selected = value === option.id;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "flex flex-col items-start gap-3 rounded-2xl border px-4 py-5 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/10"
                  : "border-[#E5E8EB] bg-background hover:bg-[#F2F4F6]",
              )}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-[#F2F4F6] text-[#848C94]",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span>
                <span
                  className={cn(
                    "block text-[16px] font-bold",
                    selected ? "text-primary" : "text-foreground",
                  )}
                >
                  {option.title}
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
