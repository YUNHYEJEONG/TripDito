"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldLabel } from "@/components/common/field-label";
import { defaultItemFormValues } from "../constants";
import { addDaysIso, getTripDayFilterOptions } from "../utils/trip-day";
import { cn } from "@/lib/utils";
import { GIFT_TAG_OPTIONS, type GiftTagId } from "../constants/gift-tags";
import { shoppingItemFormSchema, type ShoppingItemFormValues } from "../schema";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"] as const;

function formatDayChip(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getMonth() + 1}.${d.getDate()} ${WEEKDAY[d.getDay()]}`;
}

export function ItemForm({
  defaultValues,
  tripRange,
  submitLabel = "저장",
  onSubmit,
  onCancel,
}: {
  defaultValues?: Partial<ShoppingItemFormValues>;
  /** 여행 기간. 주어지면 예상 구매일을 여행 일차 칩으로 고른다 (기간 밖 선택 불가) */
  tripRange?: { startDate: string; endDate: string };
  submitLabel?: string;
  onSubmit: (values: ShoppingItemFormValues) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const form = useForm<ShoppingItemFormValues>({
    resolver: zodResolver(shoppingItemFormSchema),
    defaultValues: {
      ...defaultItemFormValues,
      ...defaultValues,
      giftTags: defaultValues?.giftTags ?? defaultItemFormValues.giftTags,
    },
  });

  const imageDataUrl = form.watch("imageDataUrl");
  const giftTags = form.watch("giftTags") ?? [];
  const plannedPurchaseDate = form.watch("plannedPurchaseDate") ?? null;

  const dayOptions = tripRange
    ? getTripDayFilterOptions(tripRange.startDate, tripRange.endDate).map(
        (day) => ({ day, iso: addDaysIso(tripRange.startDate, day - 1) }),
      )
    : [];

  function setPlannedDate(next: string | null) {
    form.setValue("plannedPurchaseDate", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function toggleGiftTag(id: GiftTagId) {
    const next = giftTags.includes(id)
      ? giftTags.filter((tag) => tag !== id)
      : [...giftTags, id];
    form.setValue("giftTags", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit({
          ...values,
          giftTags: values.giftTags ?? [],
          plannedPurchaseDate: values.plannedPurchaseDate ?? null,
        });
      })}
    >
      {imageDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageDataUrl}
          alt=""
          className="h-40 w-full rounded-2xl object-cover"
        />
      ) : null}
      <Field
        label="상품명"
        required
        error={form.formState.errors.name?.message}
      >
        <Input placeholder="상품명" {...form.register("name")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="예상 가격"
          required
          error={form.formState.errors.estimatedPrice?.message}
        >
          <Input
            type="number"
            min={0}
            step="any"
            {...form.register("estimatedPrice", { valueAsNumber: true })}
          />
        </Field>
        <Field
          label="수량"
          required
          error={form.formState.errors.quantity?.message}
        >
          <Input
            type="number"
            min={1}
            step={1}
            {...form.register("quantity", { valueAsNumber: true })}
          />
        </Field>
      </div>
      <Field
        label="예상 구매일"
        error={form.formState.errors.plannedPurchaseDate?.message}
      >
        {tripRange && dayOptions.length > 0 ? (
          <div
            role="radiogroup"
            aria-label="예상 구매일"
            className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <DayChip
              selected={plannedPurchaseDate === null}
              onClick={() => setPlannedDate(null)}
              title="미정"
            />
            {plannedPurchaseDate &&
            !dayOptions.some((o) => o.iso === plannedPurchaseDate) ? (
              /* 여행 날짜를 나중에 바꿔 기간 밖이 된 기존 값 — 보이게 두고 다른 일차로 옮길 수 있게 */
              <DayChip
                selected
                onClick={() => undefined}
                title="기간 밖"
                subtitle={formatDayChip(plannedPurchaseDate)}
              />
            ) : null}
            {dayOptions.map(({ day, iso }) => (
              <DayChip
                key={iso}
                selected={plannedPurchaseDate === iso}
                onClick={() => setPlannedDate(iso)}
                title={`${day}일차`}
                subtitle={formatDayChip(iso)}
              />
            ))}
          </div>
        ) : (
          <Input
            type="date"
            min={tripRange?.startDate}
            max={tripRange?.endDate}
            value={plannedPurchaseDate ?? ""}
            onChange={(event) =>
              setPlannedDate(event.target.value ? event.target.value : null)
            }
          />
        )}
      </Field>
      <Field label="선물 태그">
        <div className="flex flex-wrap gap-2">
          {GIFT_TAG_OPTIONS.map((tag) => {
            const checked = giftTags.includes(tag.id);
            return (
              <label
                key={tag.id}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/80 px-2.5 py-2 text-[13px]"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleGiftTag(tag.id)}
                  className="size-4 border border-border bg-background data-checked:border-primary data-checked:bg-primary"
                />
                <span
                  className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-[#191F28]"
                  style={{ backgroundColor: tag.bg }}
                >
                  {tag.label}
                </span>
              </label>
            );
          })}
        </div>
      </Field>
      <Field label="메모" error={form.formState.errors.memo?.message}>
        <Textarea rows={3} placeholder="메모" {...form.register("memo")} />
      </Field>
      <input type="hidden" {...form.register("imageDataUrl")} />
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
        ) : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function DayChip({
  selected,
  onClick,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex h-11 shrink-0 flex-col items-center justify-center rounded-lg border px-3 leading-none transition-colors",
        selected
          ? "border-primary bg-brand-soft text-primary"
          : "border-border/80 bg-background text-foreground hover:bg-secondary",
      )}
    >
      <span className="text-[13px] font-semibold">{title}</span>
      {subtitle ? (
        <span
          className={cn(
            "mt-1 text-[10px]",
            selected ? "text-primary/80" : "text-muted-foreground",
          )}
        >
          {subtitle}
        </span>
      ) : null}
    </button>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
