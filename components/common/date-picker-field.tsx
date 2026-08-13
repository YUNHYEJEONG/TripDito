"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHandle,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export type DatePickerFieldHandle = { open: () => void };

function parseIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function buildMonthCells(month: Date) {
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = Array.from(
    { length: month.getDay() },
    () => null,
  );
  for (let day = 1; day <= days; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

function formatDisplay(value: string) {
  const date = parseIso(value);
  if (!date) return "";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export const DatePickerField = forwardRef<
  DatePickerFieldHandle,
  {
    value: string;
    onChange: (value: string) => void;
    min?: string;
    max?: string;
    placeholder?: string;
    "aria-label": string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
    className?: string;
    onConfirm?: (value: string) => void;
  }
>(function DatePickerField(
  {
    value,
    onChange,
    min,
    max,
    placeholder = "날짜 선택",
    "aria-label": ariaLabel,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
    className,
    onConfirm,
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [month, setMonth] = useState(() =>
    monthStart(parseIso(value) ?? parseIso(min ?? "") ?? new Date()),
  );

  useImperativeHandle(ref, () => ({ open: () => setOpen(true) }));

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setMonth(monthStart(parseIso(value) ?? parseIso(min ?? "") ?? new Date()));
  }, [min, open, value]);

  const minDate = useMemo(() => parseIso(min ?? ""), [min]);
  const maxDate = useMemo(() => parseIso(max ?? ""), [max]);
  const draftDate = useMemo(() => parseIso(draft), [draft]);
  const cells = useMemo(() => buildMonthCells(month), [month]);
  const monthLabel = `${month.getFullYear()}년 ${month.getMonth() + 1}월`;

  function disabled(date: Date) {
    return Boolean((minDate && date < minDate) || (maxDate && date > maxDate));
  }

  function confirm() {
    if (!draft || !draftDate || disabled(draftDate)) return;
    onChange(draft);
    setOpen(false);
    onConfirm?.(draft);
  }

  return (
    <>
      <button
        type="button"
        aria-label={`${ariaLabel}${value ? `, ${formatDisplay(value)}` : ""}`}
        data-invalid={ariaInvalid ? "true" : undefined}
        aria-describedby={ariaDescribedBy}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl bg-paper-2 px-3.5 text-left text-[15px] text-ink outline-none transition-colors hover:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus",
          !value && "text-ink-3",
          ariaInvalid && "border border-destructive ring-2 ring-destructive/20",
          className,
        )}
      >
        <CalendarDays className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{value ? formatDisplay(value) : placeholder}</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent showCloseButton={false} className="max-h-[min(42rem,92dvh)]">
          <SheetHandle />
          <SheetHeader className="items-center text-center">
            <SheetTitle className="text-[17px] font-semibold text-ink">
              {ariaLabel}
            </SheetTitle>
            <SheetDescription className="text-[12px]">
              여행할 날짜를 선택해 주세요.
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="pb-3">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="이전 달"
                onClick={() => setMonth((current) => addMonths(current, -1))}
              >
                <ChevronLeft />
              </Button>
              <p className="text-[15px] font-semibold text-ink" aria-live="polite">
                {monthLabel}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="다음 달"
                onClick={() => setMonth((current) => addMonths(current, 1))}
              >
                <ChevronRight />
              </Button>
            </div>

            <div role="grid" aria-label={monthLabel} className="mt-2 grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  role="columnheader"
                  className="py-1 text-center text-[11px] font-medium text-ink-2"
                >
                  {weekday}
                </div>
              ))}
              {cells.map((date, index) => {
                if (!date) {
                  return <span key={`empty-${index}`} role="gridcell" aria-hidden />;
                }
                const iso = toIso(date);
                const isSelected = iso === draft;
                const isDisabled = disabled(date);
                return (
                  <button
                    key={iso}
                    type="button"
                    role="gridcell"
                    aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`}
                    aria-selected={isSelected}
                    disabled={isDisabled}
                    onClick={() => setDraft(iso)}
                    className={cn(
                      "aspect-square min-h-10 rounded-lg text-[13px] font-medium text-ink outline-none hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-focus",
                      isSelected && "bg-accent-text text-paper hover:bg-accent-text",
                      isDisabled && "text-ink-3 opacity-40",
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </SheetBody>

          <SheetFooter className="flex-row">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="button" className="flex-1" disabled={!draftDate || disabled(draftDate)} onClick={confirm}>
              선택
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
});
