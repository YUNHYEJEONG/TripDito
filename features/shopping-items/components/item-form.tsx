"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldLabel } from "@/components/common/field-label";
import { getCurrency } from "@/config/currencies";
import { defaultItemFormValues } from "../constants";
import { GiftTagField } from "./gift-tag-field";
import { ItemImageFrame } from "./item-image-frame";
import { ItemStatusTags } from "./item-status-tags";
import {
  shoppingItemFormSchema,
  type ShoppingItemFormValues,
} from "../schema";
import {
  addDaysIso,
  getTripDayFilterOptions,
  getTripDayNumbers,
  normalizePlannedPurchaseDates,
} from "../utils/trip-day";

export function ItemForm({
  defaultValues,
  submitLabel = "저장",
  currency,
  purchased = false,
  tripStartDate,
  tripEndDate,
  onSubmit,
  onCancel,
  children,
}: {
  defaultValues?: Partial<ShoppingItemFormValues> & {
    plannedPurchaseDate?: string | null;
  };
  submitLabel?: string;
  currency?: string;
  purchased?: boolean;
  tripStartDate?: string;
  tripEndDate?: string;
  onSubmit: (values: ShoppingItemFormValues) => Promise<void> | void;
  onCancel?: () => void;
  /** 메모 필드 아래 (예: 상품 삭제) */
  children?: React.ReactNode;
}) {
  const currencyMeta = getCurrency(currency ?? "JPY");
  const initialDates = normalizePlannedPurchaseDates({
    plannedPurchaseDates: defaultValues?.plannedPurchaseDates,
    plannedPurchaseDate: defaultValues?.plannedPurchaseDate,
  });

  const form = useForm<ShoppingItemFormValues>({
    resolver: zodResolver(shoppingItemFormSchema),
    defaultValues: {
      ...defaultItemFormValues,
      ...defaultValues,
      plannedPurchaseDates: initialDates,
      giftTags: defaultValues?.giftTags ?? defaultItemFormValues.giftTags,
    },
  });

  const imageDataUrl = form.watch("imageDataUrl");
  const giftTags = form.watch("giftTags") ?? [];
  const plannedPurchaseDates = form.watch("plannedPurchaseDates") ?? [];

  const dayOptions = useMemo(() => {
    if (!tripStartDate || !tripEndDate) return [];
    return getTripDayFilterOptions(tripStartDate, tripEndDate);
  }, [tripStartDate, tripEndDate]);

  const selectedDays =
    tripStartDate && tripEndDate
      ? getTripDayNumbers(tripStartDate, tripEndDate, plannedPurchaseDates)
      : [];

  function toggleDay(day: number, checked: boolean) {
    if (!tripStartDate) return;
    const dateIso = addDaysIso(tripStartDate, day - 1);
    const next = checked
      ? [...new Set([...plannedPurchaseDates, dateIso])].sort()
      : plannedPurchaseDates.filter((date) => date !== dateIso);
    form.setValue("plannedPurchaseDates", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit({
          ...values,
          giftTags: values.giftTags ?? [],
          plannedPurchaseDates: normalizePlannedPurchaseDates(values),
        });
      })}
    >
      <div className="scrollbar-none flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pt-2 pb-4">
        <ItemImageFrame imageDataUrl={imageDataUrl} />
        <ItemStatusTags
          purchased={purchased}
          giftTags={giftTags}
          className="mb-3 flex flex-wrap items-center gap-1"
        />
        <Field
          label="상품명"
          required
          error={form.formState.errors.name?.message}
        >
          <Textarea
            rows={1}
            placeholder="상품명"
            className="min-h-10 py-2.5"
            {...form.register("name")}
          />
        </Field>
        <div className="flex flex-col gap-1.5">
          <FieldLabel required>예상 가격</FieldLabel>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              placeholder="예상 가격"
              className="w-[7rem] shrink-0 text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="예상 가격"
              {...form.register("estimatedPrice", { valueAsNumber: true })}
            />
            <span className="shrink-0 text-[12px] font-medium text-muted-foreground">
              {currencyMeta.code}
            </span>
            <Input
              type="number"
              min={1}
              max={1000}
              step={1}
              inputMode="numeric"
              placeholder="1"
              className="w-[4.75rem] shrink-0 px-2 text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="수량"
              {...form.register("quantity", { valueAsNumber: true })}
            />
            <span className="shrink-0 text-[12px] font-medium text-muted-foreground">
              개
            </span>
          </div>
          {form.formState.errors.estimatedPrice?.message ||
          form.formState.errors.quantity?.message ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.estimatedPrice?.message ??
                form.formState.errors.quantity?.message}
            </p>
          ) : null}
        </div>
        <Field
          label="예상 구매일"
          error={form.formState.errors.plannedPurchaseDates?.message}
        >
          {dayOptions.length > 0 && tripStartDate ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {dayOptions.map((day) => {
                const checked = selectedDays.includes(day);
                return (
                  <label
                    key={day}
                    className="flex cursor-pointer items-center gap-2 text-[13px] text-foreground"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        toggleDay(day, value === true)
                      }
                      aria-label={`${day}일차`}
                    />
                    {day}일차
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">
              여행 일정이 없어 일차를 선택할 수 없어요.
            </p>
          )}
        </Field>
        <Field label="선물 대상">
          <GiftTagField
            value={giftTags}
            onChange={(next) =>
              form.setValue("giftTags", next, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </Field>
        <Field label="메모" error={form.formState.errors.memo?.message}>
          <Textarea
            rows={3}
            placeholder="메모"
            className="text-[12px] placeholder:text-[12px]"
            {...form.register("memo")}
          />
        </Field>
        {children}
        <input type="hidden" {...form.register("imageDataUrl")} />
      </div>

      <div className="sticky bottom-0 z-10 flex shrink-0 gap-2 bg-background pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            취소
          </Button>
        ) : null}
        <Button
          type="submit"
          className={onCancel ? "flex-[1.6]" : "w-full"}
          disabled={form.formState.isSubmitting}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
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
