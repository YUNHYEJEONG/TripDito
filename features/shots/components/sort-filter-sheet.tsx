"use client";

import { useId } from "react";
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
  const groupName = useId();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-w-[480px] rounded-t-2xl"
      >
        <SheetCloseHeader title="정렬" onClose={() => onOpenChange(false)} />

        <fieldset className="mt-2 flex flex-col px-2 pb-6">
          <legend className="sr-only">정렬 선택</legend>
          {SHOT_SORT_OPTIONS.map((option) => {
            const selected = value === option.value;
            return (
              <label
                key={option.value}
                className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3"
              >
                <input
                  type="radio"
                  name={groupName}
                  value={option.value}
                  checked={selected}
                  className="peer sr-only"
                  onChange={() => {
                    onSelect(option.value);
                    onOpenChange(false);
                  }}
                />
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2 outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-offset-2",
                    selected ? "border-accent" : "border-control",
                  )}
                >
                  {selected ? (
                    <span className="size-2.5 rounded-full bg-accent" />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "text-[15px]",
                    selected
                      ? "font-semibold text-accent-text"
                      : "font-medium text-ink",
                  )}
                >
                  {option.label}
                </span>
              </label>
            );
          })}
        </fieldset>
      </SheetContent>
    </Sheet>
  );
}
