"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export type DatePickerFieldHandle = {
  open: () => void;
};

function parseIso(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDisplay(iso: string): string {
  const date = parseIso(iso);
  if (!date) return "";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function buildMonthCells(month: Date): Array<Date | null> {
  const first = startOfMonth(month);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const DatePickerField = forwardRef<
  DatePickerFieldHandle,
  {
    value: string;
    onChange: (value: string) => void;
    min?: string;
    max?: string;
    placeholder?: string;
    "aria-label"?: string;
    className?: string;
    /** 선택(확정) 버튼을 눌렀을 때만 호출 */
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
    className,
    onConfirm,
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [month, setMonth] = useState(() => {
    return startOfMonth(parseIso(value) ?? parseIso(min ?? "") ?? new Date());
  });

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
  }));

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setMonth(
      startOfMonth(parseIso(value) ?? parseIso(min ?? "") ?? new Date()),
    );
  }, [open, value, min]);

  const minDate = useMemo(() => parseIso(min ?? ""), [min]);
  const maxDate = useMemo(() => parseIso(max ?? ""), [max]);
  const draftDate = useMemo(() => parseIso(draft), [draft]);
  const cells = useMemo(() => buildMonthCells(month), [month]);

  const monthLabel = `${month.getFullYear()}년 ${month.getMonth() + 1}월`;

  function isDisabled(date: Date): boolean {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }

  function handleConfirm() {
    if (!draft) return;
    onChange(draft);
    setOpen(false);
    onConfirm?.(draft);
  }

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        className={cn(
          "h-10 min-w-0 flex-1 rounded-lg border border-[#CFD4DA] bg-background px-3 text-left text-[13px] text-foreground outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
          !value && "text-muted-foreground",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        {value ? formatDisplay(value) : placeholder}
      </button>

      {/* 접근성/폼용 숨김 값 (네이티브 검증 보조) */}
      <Input type="hidden" value={value} readOnly tabIndex={-1} aria-hidden />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="gap-4 px-4 pt-4 pb-4 sm:max-w-[22.5rem]"
        >
          <DialogTitle className="text-center text-[16px] font-bold">
            {ariaLabel ?? "날짜 선택"}
          </DialogTitle>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="이전 달"
              onClick={() => setMonth((prev) => addMonths(prev, -1))}
            >
              <ChevronLeft className="size-5" />
            </Button>
            <p className="text-[14px] font-semibold text-foreground">
              {monthLabel}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="다음 달"
              onClick={() => setMonth((prev) => addMonths(prev, 1))}
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-[11px] font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
            {cells.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }
              const iso = toIso(date);
              const selected = draftDate ? sameDay(date, draftDate) : false;
              const disabled = isDisabled(date);
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => setDraft(iso)}
                  className={cn(
                    "aspect-square rounded-lg text-[13px] font-medium transition-colors",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted",
                    disabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              className="h-11 flex-1"
              disabled={!draft || (draftDate ? isDisabled(draftDate) : true)}
              onClick={handleConfirm}
            >
              선택
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
