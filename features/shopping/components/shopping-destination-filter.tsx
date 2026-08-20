"use client";

import { cn } from "@/lib/utils";
import type { ShoppingDestination } from "../data/demo-shopping-content";

export function ShoppingDestinationFilter({
  value,
  options,
  onChange,
}: {
  value: ShoppingDestination;
  options: { city: string; country: string }[];
  onChange: (next: ShoppingDestination) => void;
}) {
  return (
    <div
      role="group"
      aria-label="쇼핑 여행지"
      className="-mx-4 overflow-x-auto overscroll-x-contain px-4"
    >
      <div className="flex w-max items-center gap-2 pb-1">
        <DestinationChip
          label="전체"
          selected={!value}
          onClick={() => onChange(null)}
        />
        {options.map((option) => {
          const selected =
            value?.city === option.city && value?.country === option.country;
          return (
            <DestinationChip
              key={`${option.country}-${option.city}`}
              label={option.city}
              accessibleLabel={`${option.country} ${option.city}`}
              selected={selected}
              onClick={() => onChange(option)}
            />
          );
        })}
      </div>
    </div>
  );
}

function DestinationChip({
  label,
  accessibleLabel,
  selected,
  onClick,
}: {
  label: string;
  accessibleLabel?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={accessibleLabel}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 shrink-0 items-center rounded-full border px-3 text-[13px] font-semibold outline-none transition-colors duration-120 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        selected
          ? "border-accent-text bg-accent-text text-paper hover:bg-accent active:bg-accent-text"
          : "border-rule bg-paper text-ink hover:bg-paper-2 active:bg-paper-2",
      )}
    >
      {label}
    </button>
  );
}
