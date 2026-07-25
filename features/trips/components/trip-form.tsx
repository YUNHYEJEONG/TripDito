"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/common/field-label";
import { CURRENCIES } from "@/config/currencies";
import { defaultTripFormValues } from "../constants";
import { tripFormSchema, type TripFormValues } from "../schema";

export function TripForm({
  defaultValues,
  submitLabel = "저장",
  onSubmit,
  onCancel,
}: {
  defaultValues?: Partial<TripFormValues>;
  submitLabel?: string;
  onSubmit: (values: TripFormValues) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: { ...defaultTripFormValues, ...defaultValues },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <Field
        label="여행명"
        required
        error={form.formState.errors.name?.message}
      >
        <Input placeholder="예: 도쿄 3박 4일" {...form.register("name")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="국가"
          required
          error={form.formState.errors.country?.message}
        >
          <Input placeholder="일본" {...form.register("country")} />
        </Field>
        <Field
          label="도시"
          required
          error={form.formState.errors.city?.message}
        >
          <Input placeholder="도쿄" {...form.register("city")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="시작일"
          required
          error={form.formState.errors.startDate?.message}
        >
          <Input type="date" {...form.register("startDate")} />
        </Field>
        <Field
          label="종료일"
          required
          error={form.formState.errors.endDate?.message}
        >
          <Input type="date" {...form.register("endDate")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="통화"
          required
          error={form.formState.errors.currency?.message}
        >
          <select
            className="h-10 w-full rounded-xl border border-transparent bg-input px-3 text-[13px] shadow-neu-inset outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            {...form.register("currency")}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="예산"
          required
          error={form.formState.errors.budget?.message}
        >
          <Input
            type="number"
            min={0}
            step="any"
            {...form.register("budget", { valueAsNumber: true })}
          />
        </Field>
      </div>
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
