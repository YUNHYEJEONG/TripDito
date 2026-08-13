"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/config/currencies";
import { getCurrency } from "@/config/currencies";
import { DatePickerField } from "@/components/common/date-picker-field";
import { cn } from "@/lib/utils";
import { defaultTripFormValues } from "../constants";
import { tripFormSchema, type TripFormValues } from "../schema";
import {
  requestPageNavigation,
  useUnsavedChanges,
} from "@/lib/navigation/unsaved-changes";
import { useTrips } from "../hooks/use-trips";
import {
  findOverlappingTrip,
  tripDateOverlapMessage,
} from "../utils/trip-date-overlap";

const CURRENCY_ITEMS = CURRENCIES.map((currency) => ({
  value: currency.code,
  label: currency.label,
}));

export function TripForm({
  defaultValues,
  submitLabel = "여행 저장",
  onSubmit,
  onCancel,
  lockCurrency = false,
  tripId,
}: {
  defaultValues?: Partial<TripFormValues>;
  submitLabel?: string;
  onSubmit: (values: TripFormValues) => Promise<void> | void;
  onCancel?: () => void;
  lockCurrency?: boolean;
  tripId?: string;
}) {
  const { data: trips = [] } = useTrips();
  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      ...defaultTripFormValues,
      ...defaultValues,
      budgetMode:
        defaultValues?.budgetMode ??
        ((defaultValues?.budget ?? 0) > 0 ? "input" : "unknown"),
    },
  });

  const errors = form.formState.errors;
  const [startDate, currency, watchedBudgetMode] = useWatch({
    control: form.control,
    name: ["startDate", "currency", "budgetMode"],
  });
  const budgetMode = watchedBudgetMode ?? "unknown";
  useUnsavedChanges(form.formState.isDirty);

  return (
    <form
      className="mx-auto flex w-full max-w-2xl flex-col gap-8 pb-[calc(6rem+env(safe-area-inset-bottom))] [&+section]:mb-24"
      data-unsaved={form.formState.isDirty ? "true" : undefined}
      aria-busy={form.formState.isSubmitting}
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        const overlap = findOverlappingTrip(
          trips,
          values.startDate,
          values.endDate,
          tripId,
        );
        if (overlap) {
          form.setError("endDate", {
            type: "validate",
            message: tripDateOverlapMessage(overlap),
          });
          return;
        }
        await onSubmit({
          ...values,
          budget: values.budgetMode === "unknown" ? 0 : values.budget,
        });
      })}
    >
      <section
        className="flex flex-col gap-5"
        aria-labelledby="trip-info-heading"
      >
        <h2
          id="trip-info-heading"
          className="text-[18px] leading-[1.45] font-semibold text-ink"
        >
          여행 정보
        </h2>
        <p className="-mt-4 text-[13px] leading-5 text-ink-2">
          홈 티켓과 쇼핑리스트에 표시할 이름과 여행지를 적어 주세요.
        </p>

        <Field
          id="trip-name"
          label="여행 이름"
          required
          description="도시와 기간을 함께 적으면 나중에 찾기 쉬워요."
          error={errors.name?.message}
        >
          <Input
            id="trip-name"
            autoComplete="off"
            placeholder="예: 도쿄 3박 4일"
            aria-invalid={Boolean(errors.name)}
            aria-describedby="trip-name-message"
            {...form.register("name")}
          />
        </Field>

        <div className="grid gap-5">
          <Field
            id="trip-country"
            label="국가"
            required
            error={errors.country?.message}
          >
            <Input
              id="trip-country"
              autoComplete="country-name"
              placeholder="예: 일본"
              aria-invalid={Boolean(errors.country)}
              aria-describedby="trip-country-message"
              {...form.register("country")}
            />
          </Field>
          <Field
            id="trip-city"
            label="도시"
            required
            error={errors.city?.message}
          >
            <Input
              id="trip-city"
              autoComplete="address-level2"
              placeholder="예: 도쿄"
              aria-invalid={Boolean(errors.city)}
              aria-describedby="trip-city-message"
              {...form.register("city")}
            />
          </Field>
        </div>
      </section>

      <section
        className="flex flex-col gap-5 border-t border-rule pt-7"
        aria-labelledby="trip-schedule-heading"
      >
        <h2
          id="trip-schedule-heading"
          className="text-[18px] leading-[1.45] font-semibold text-ink"
        >
          일정과 예산
        </h2>
        <p className="-mt-4 text-[13px] leading-5 text-ink-2">
          여행 날짜에 맞춰 홈 화면과 쇼핑 일정이 자동으로 바뀌어요.
        </p>

        <div className="grid gap-5">
          <Field
            id="trip-start-date"
            label="시작일"
            required
            error={errors.startDate?.message}
          >
            <Controller
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <DatePickerField
                  aria-label="여행 시작일"
                  aria-invalid={Boolean(errors.startDate)}
                  aria-describedby="trip-start-date-message"
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    form.clearErrors(["startDate", "endDate"]);
                  }}
                />
              )}
            />
          </Field>
          <Field
            id="trip-end-date"
            label="종료일"
            required
            error={errors.endDate?.message}
          >
            <Controller
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <DatePickerField
                  aria-label="여행 종료일"
                  aria-invalid={Boolean(errors.endDate)}
                  aria-describedby="trip-end-date-message"
                  min={startDate || undefined}
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    form.clearErrors("endDate");
                  }}
                />
              )}
            />
          </Field>
        </div>

        <div className="grid gap-5">
          <Field
            id="trip-currency"
            label="기준 통화"
            required
            description={
              lockCurrency
                ? "등록된 상품의 금액을 보호하려고 기준 통화를 유지해요."
                : "쇼핑 금액과 예산을 표시할 통화예요."
            }
            error={errors.currency?.message}
          >
            <Controller
              control={form.control}
              name="currency"
              render={({ field }) => (
                <Select
                  items={CURRENCY_ITEMS}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={lockCurrency}
                >
                  <SelectTrigger
                    id="trip-currency"
                    className="w-full"
                    aria-invalid={Boolean(errors.currency)}
                    aria-describedby="trip-currency-message"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_ITEMS.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field
            id="trip-budget-mode"
            label="쇼핑 예산"
            required
            description={
              budgetMode === "unknown"
                ? "아직 정하지 않았다면 나중에 입력할 수 있어요."
                : `상품 가격과 같은 ${currency} 단위로 입력해 주세요.`
            }
            error={errors.budget ? "예산을 0 이상 입력해 주세요." : undefined}
          >
            <Controller
              control={form.control}
              name="budgetMode"
              render={({ field }) => (
                <div role="radiogroup" aria-label="쇼핑 예산 입력 방식" className="grid grid-cols-2 gap-2">
                  {(["unknown", "input"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      role="radio"
                      aria-checked={(field.value ?? "unknown") === mode}
                      onClick={() => {
                        field.onChange(mode);
                        if (mode === "unknown") form.setValue("budget", 0, { shouldDirty: true });
                        form.clearErrors("budget");
                      }}
                      className={cn(
                        "min-h-11 rounded-xl border border-rule px-3 text-[14px] font-semibold outline-none hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-focus",
                        (field.value ?? "unknown") === mode && "border-accent-text bg-paper-2 text-accent-text",
                      )}
                    >
                      {mode === "unknown" ? "아직 모름" : "직접 입력"}
                    </button>
                  ))}
                </div>
              )}
            />
            {budgetMode === "input" ? (
              <div className="relative mt-1">
                <Input
                  id="trip-budget"
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  className="pr-16 text-right"
                  aria-label={`쇼핑 예산, ${currency}`}
                  aria-invalid={Boolean(errors.budget)}
                  aria-describedby="trip-budget-message"
                  {...form.register("budget", { valueAsNumber: true })}
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[13px] font-semibold text-ink-2">
                  {getCurrency(currency)?.code ?? currency}
                </span>
              </div>
            ) : null}
          </Field>
        </div>
      </section>

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
