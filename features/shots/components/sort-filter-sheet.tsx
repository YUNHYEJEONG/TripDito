"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SheetCloseHeader } from "@/components/common/sheet-close-header";
import { cn } from "@/lib/utils";
import { SHOT_SORT_OPTIONS } from "../constants";
import type { ShotSort } from "../schema";

export function SortFilterSheet({
  open,
  onOpenChange,
  value,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ShotSort;
  onSelect: (sort: ShotSort) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-w-[480px] rounded-t-2xl md:max-w-[720px] lg:max-w-[960px]"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#D1D5DB]" />
        <SheetCloseHeader title="정렬" onClose={() => onOpenChange(false)} />

        <div
          role="radiogroup"
          aria-label="정렬 선택"
          className="mt-2 flex flex-col px-2 pb-6"
        >
          {SHOT_SORT_OPTIONS.map((option) => {
            const selected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                onClick={() => {
                  onSelect(option.value);
                  onOpenChange(false);
                }}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                    selected ? "border-primary" : "border-[#D1D5DB]",
                  )}
                >
                  {selected ? (
                    <span className="size-2.5 rounded-full bg-primary" />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "text-[15px]",
                    selected
                      ? "font-semibold text-primary"
                      : "font-medium text-foreground",
                  )}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
