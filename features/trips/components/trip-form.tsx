"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <Field label="여행명" error={form.formState.errors.name?.message}>
        <Input placeholder="예: 도쿄 3박 4일" {...form.register("name")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="국가" error={form.formState.errors.country?.message}>
          <Input placeholder="일본" {...form.register("country")} />
        </Field>
        <Field label="도시" error={form.formState.errors.city?.message}>
          <Input placeholder="도쿄" {...form.register("city")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="시작일" error={form.formState.errors.startDate?.message}>
          <Input type="date" {...form.register("startDate")} />
        </Field>
        <Field label="종료일" error={form.formState.errors.endDate?.message}>
          <Input type="date" {...form.register("endDate")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="통화" error={form.formState.errors.currency?.message}>
          <select
            className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            {...form.register("currency")}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="예산" error={form.formState.errors.budget?.message}>
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
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
