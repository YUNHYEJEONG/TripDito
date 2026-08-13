"use client";

import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { defaultItemFormValues } from "../constants";
import { GIFT_TAG_OPTIONS, type GiftTagId } from "../constants/gift-tags";
import {
  shoppingItemFormSchema,
  type ShoppingItemFormValues,
} from "../schema";
import {
  requestPageNavigation,
  useUnsavedChanges,
} from "@/lib/navigation/unsaved-changes";
import {
  addDaysIso,
  getTripDayFilterOptions,
  getTripDayNumbers,
  normalizePlannedPurchaseDates,
} from "../utils/trip-day";

export function ItemForm({
  defaultValues,
  currency,
  submitLabel = "상품 저장",
  onSubmit,
  onCancel,
  tripStartDate,
  tripEndDate,
}: {
  defaultValues?: Partial<ShoppingItemFormValues>;
  currency?: string;
  submitLabel?: string;
  onSubmit: (values: ShoppingItemFormValues) => Promise<void> | void;
  onCancel?: () => void;
  tripStartDate?: string;
  tripEndDate?: string;
}) {
  const initialDates = normalizePlannedPurchaseDates({
    plannedPurchaseDates: defaultValues?.plannedPurchaseDates,
    plannedPurchaseDate: defaultValues?.plannedPurchaseDate,
  });
  const form = useForm<ShoppingItemFormValues>({
    resolver: zodResolver(shoppingItemFormSchema),
    defaultValues: {
      ...defaultItemFormValues,
      ...defaultValues,
      plannedPurchaseDate: initialDates[0] ?? null,
      plannedPurchaseDates: initialDates,
      giftTags: defaultValues?.giftTags ?? defaultItemFormValues.giftTags,
    },
  });

  const imageDataUrl = useWatch({
    control: form.control,
    name: "imageDataUrl",
  });
  const giftTags = useWatch({ control: form.control, name: "giftTags" });
  const plannedPurchaseDates =
    useWatch({ control: form.control, name: "plannedPurchaseDates" }) ?? [];
  const errors = form.formState.errors;
  useUnsavedChanges(form.formState.isDirty);

  const dayOptions = useMemo(() => {
    if (!tripStartDate || !tripEndDate) return [];
    return getTripDayFilterOptions(tripStartDate, tripEndDate);
  }, [tripStartDate, tripEndDate]);
  const selectedDays =
    tripStartDate && tripEndDate
      ? getTripDayNumbers(
          tripStartDate,
          tripEndDate,
          plannedPurchaseDates,
        )
      : [];

  function toggleGiftTag(id: GiftTagId) {
    const next = giftTags.includes(id)
      ? giftTags.filter((tag) => tag !== id)
      : [...giftTags, id];
    form.setValue("giftTags", next, { shouldDirty: true, shouldValidate: true });
  }

  function togglePlannedDay(day: number, checked: boolean) {
    if (!tripStartDate) return;
    const date = addDaysIso(tripStartDate, day - 1);
    const next = checked
      ? [...new Set([...plannedPurchaseDates, date])].sort()
      : plannedPurchaseDates.filter((candidate) => candidate !== date);
    form.setValue("plannedPurchaseDates", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("plannedPurchaseDate", next[0] ?? null, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <form
      className="mx-auto flex w-full max-w-2xl flex-col gap-8 pb-[calc(6rem+env(safe-area-inset-bottom))] [&+section]:mb-24"
      data-unsaved={form.formState.isDirty ? "true" : undefined}
      aria-busy={form.formState.isSubmitting}
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        const dates = normalizePlannedPurchaseDates(values);
        const invalidDate = dates.find(
          (date) =>
            tripStartDate &&
            tripEndDate &&
            (date < tripStartDate || date > tripEndDate),
        );
        if (invalidDate) {
          form.setError(
            "plannedPurchaseDates",
            { message: "여행 기간 안의 날짜를 선택해 주세요." },
          );
          return;
        }
        await onSubmit({
          ...values,
          plannedPurchaseDate: dates[0] ?? null,
          plannedPurchaseDates: dates,
        });
      })}
    >
      {imageDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageDataUrl}
          alt="추가할 상품 미리보기"
          className="aspect-[16/9] w-full rounded-xl object-cover"
        />
      ) : null}

      <section
        className="flex flex-col gap-5"
        aria-labelledby="item-info-heading"
      >
        <h2
          id="item-info-heading"
          className="text-[18px] leading-[1.45] font-semibold text-ink"
        >
          상품 정보
        </h2>

        <Field
          id="item-name"
          label="상품 이름"
          required
          description="쇼핑 중 바로 찾을 수 있는 이름으로 적어 주세요."
          error={errors.name?.message}
        >
          <Input
            id="item-name"
            autoComplete="off"
            placeholder="예: 말차 초콜릿"
            aria-invalid={Boolean(errors.name)}
            aria-describedby="item-name-message"
            {...form.register("name")}
          />
        </Field>

        <Field
          id="item-local-name"
          label="현지 상품명"
          description="포장지에 적힌 현지어 이름이 있다면 함께 저장해 두세요."
          error={errors.localName?.message}
        >
          <Controller
            control={form.control}
            name="localName"
            render={({ field }) => (
              <Input
                id="item-local-name"
                autoComplete="off"
                placeholder="예: 抹茶チョコレート"
                value={field.value ?? ""}
                aria-invalid={Boolean(errors.localName)}
                aria-describedby="item-local-name-message"
                onChange={(event) => field.onChange(event.target.value || null)}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            )}
          />
        </Field>

        <Field
          id="item-expected-stores"
          label="예상 구매처"
          description="여러 곳이면 쉼표로 구분해 주세요."
          error={errors.expectedStores?.message}
        >
          <Controller
            control={form.control}
            name="expectedStores"
            render={({ field }) => (
              <Input
                id="item-expected-stores"
                autoComplete="off"
                placeholder="예: 돈키호테, 마츠모토키요시"
                value={(field.value ?? []).join(", ")}
                aria-invalid={Boolean(errors.expectedStores)}
                aria-describedby="item-expected-stores-message"
                onChange={(event) =>
                  field.onChange(
                    event.target.value
                      .split(",")
                      .map((store) => store.trim())
                      .filter(Boolean),
                  )
                }
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            )}
          />
        </Field>

        <div className="grid gap-5">
          <Field
            id="item-price"
            label="예상 가격"
            required
            description={
              currency
                ? `${currency} 기준으로 입력해 주세요.`
                : "여행의 기준 통화로 입력해 주세요."
            }
            error={
              errors.estimatedPrice
                ? "예상 가격을 0 이상 입력해 주세요."
                : undefined
            }
          >
            <Input
              id="item-price"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              aria-invalid={Boolean(errors.estimatedPrice)}
              aria-describedby="item-price-message"
              {...form.register("estimatedPrice", { valueAsNumber: true })}
            />
          </Field>
          <Field
            id="item-quantity"
            label="수량"
            required
            description="1개 이상 입력해 주세요."
            error={
              errors.quantity ? "수량을 1 이상 입력해 주세요." : undefined
            }
          >
            <Input
              id="item-quantity"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              aria-invalid={Boolean(errors.quantity)}
              aria-describedby="item-quantity-message"
              {...form.register("quantity", { valueAsNumber: true })}
            />
          </Field>
        </div>
      </section>

      <section
        className="flex flex-col gap-5 border-t border-rule pt-7"
        aria-labelledby="item-plan-heading"
      >
        <h2
          id="item-plan-heading"
          className="text-[18px] leading-[1.45] font-semibold text-ink"
        >
          구매 계획
        </h2>
        <p className="-mt-4 text-[13px] leading-5 text-ink-2">
          날짜와 선물 대상을 정하면 여행 중 목록을 빠르게 확인할 수 있어요.
        </p>

        <Field
          id="item-purchase-date"
          label="구매 예정일"
          description="여러 날에 살 수 있는 상품은 일차를 여러 개 선택하세요."
          error={errors.plannedPurchaseDates?.message}
        >
          {dayOptions.length > 0 ? (
            <div
              id="item-purchase-date"
              className="grid grid-cols-2 gap-2"
              aria-describedby="item-purchase-date-message"
            >
              {dayOptions.map((day) => {
                const checked = selectedDays.includes(day);
                return (
                  <label
                    key={day}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 text-[13px] font-medium transition-colors duration-120",
                      checked
                        ? "border-ink bg-paper-2 text-ink"
                        : "border-rule bg-paper text-ink-2 hover:border-control hover:bg-paper-2",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        togglePlannedDay(day, value === true)
                      }
                      aria-label={`${day}일차 구매 예정`}
                    />
                    {day}일차
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg bg-paper-2 px-3 py-3 text-[13px] text-ink-2">
              여행 일정이 없어 구매 일차를 선택할 수 없어요.
            </p>
          )}
        </Field>

        <fieldset className="flex flex-col gap-2" aria-describedby="gift-tags-help">
          <legend className="text-[15px] leading-tight font-semibold text-ink">
            선물 대상
          </legend>
          <div className="flex flex-wrap gap-2">
            {GIFT_TAG_OPTIONS.map((tag) => {
              const checked = giftTags.includes(tag.id);
              return (
                <label
                  key={tag.id}
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-[13px] font-medium text-ink transition-colors duration-120 active:bg-paper-3",
                    checked
                      ? "border-ink bg-paper-2 hover:bg-paper-3"
                      : "border-rule bg-paper hover:border-control hover:bg-paper-2",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleGiftTag(tag.id)}
                    aria-label={`${tag.label} 선물 태그`}
                    className="size-4 border-control bg-paper data-checked:border-accent-text data-checked:bg-accent-text"
                  />
                  <span
                    className={cn(
                      "rounded-xs px-2 py-1 text-[12px] font-semibold",
                      tag.className,
                    )}
                  >
                    {tag.label}
                  </span>
                </label>
              );
            })}
          </div>
          <p id="gift-tags-help" className="min-h-5 text-[12px] leading-5 text-ink-2">
            여러 대상을 함께 선택할 수 있어요.
          </p>
        </fieldset>

        <Field
          id="item-memo"
          label="메모"
          description="매장 위치나 옵션처럼 현장에서 확인할 내용을 적어 두세요."
          error={errors.memo?.message}
        >
          <Textarea
            id="item-memo"
            rows={4}
            placeholder="예: 시부야점 2층, 딸기 맛"
            className="min-h-24 border-control bg-input text-[15px] shadow-none placeholder:text-[15px] placeholder:text-ink-3"
            aria-invalid={Boolean(errors.memo)}
            aria-describedby="item-memo-message"
            {...form.register("memo")}
          />
        </Field>
      </section>

      <input type="hidden" {...form.register("imageDataUrl")} />

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[var(--app-rail-max)] border-t border-rule bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md min-[481px]:border-x">
        <div className="grid w-full grid-cols-2 gap-2">
          {onCancel ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => requestPageNavigation(onCancel)}
            >
              취소
            </Button>
          ) : null}
          <Button
            type="submit"
            className={onCancel ? undefined : "col-span-2"}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "저장하는 중…" : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  description,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="gap-1 text-[15px] font-semibold text-ink">
        {label}
        {required ? (
          <>
            <span className="text-ink" aria-hidden>
              *
            </span>
            <span className="sr-only">필수</span>
          </>
        ) : null}
      </Label>
      {children}
      {error || description ? (
        <p
          id={`${id}-message`}
          className={
            error
              ? "text-[12px] leading-5 text-ink"
              : "text-[12px] leading-5 text-ink-2"
          }
          aria-live="polite"
        >
          {error ?? description}
        </p>
      ) : null}
    </div>
  );
}
