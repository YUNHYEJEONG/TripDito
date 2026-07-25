"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SheetCloseHeader } from "@/components/common/sheet-close-header";
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
  const [open, setOpen] = useState(false);

  const label = useMemo(() => {
    if (!value) return "전체";
    return value.city;
  }, [value]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[16px] font-bold text-foreground"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        여행지
        <span className="font-semibold text-primary">{label}</span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="mx-auto max-h-[70vh] max-w-[480px] rounded-t-2xl md:max-w-[720px] lg:max-w-[960px]"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#D1D5DB]" />
          <SheetCloseHeader title="여행지 선택" onClose={() => setOpen(false)} />

          <ul className="mt-2 max-h-[50vh] overflow-y-auto px-2 pb-6">
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[14px]",
                  !value
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-foreground hover:bg-[#F2F4F6]",
                )}
              >
                전체
                {!value ? <Check className="size-4" aria-hidden /> : null}
              </button>
            </li>
            {options.map((opt) => {
              const selected =
                value?.city === opt.city && value?.country === opt.country;
              return (
                <li key={`${opt.country}-${opt.city}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[14px]",
                      selected
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-foreground hover:bg-[#F2F4F6]",
                    )}
                  >
                    <span>
                      {opt.city}
                      <span className="ml-1.5 text-[12px] font-normal text-muted-foreground">
                        {opt.country}
                      </span>
                    </span>
                    {selected ? (
                      <Check className="size-4" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
