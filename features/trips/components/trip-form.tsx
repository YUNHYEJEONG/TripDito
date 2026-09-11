"use client";

import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldLabel } from "@/components/common/field-label";
import { CURRENCIES } from "@/config/currencies";
import {
  COUNTRY_NAMES,
  findDestination,
  getCitiesOf,
} from "@/config/destinations";
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

  const country = useWatch({ control: form.control, name: "country" });
  const city = useWatch({ control: form.control, name: "city" });

  // 목록에 없는 값(예전 여행·URL 프리필)도 잃지 않도록 현재 값을 선택지에 끼워 넣는다
  const countryItems = useMemo(() => {
    const names =
      country && !COUNTRY_NAMES.includes(country)
        ? [country, ...COUNTRY_NAMES]
        : COUNTRY_NAMES;
    return names.map((name) => ({ value: name, label: name }));
  }, [country]);

  const cityItems = useMemo(() => {
    const cities = getCitiesOf(country);
    const names = city && !cities.includes(city) ? [city, ...cities] : cities;
    return names.map((name) => ({ value: name, label: name }));
  }, [country, city]);

  function handleCountryChange(next: string) {
    form.setValue("country", next, { shouldValidate: true, shouldDirty: true });
    const dest = findDestination(next);
    // 국가가 바뀌면 도시는 그 나라 첫 도시로, 통화는 지원되는 경우에만 자동 반영
    if (!dest?.cities.includes(form.getValues("city"))) {
      form.setValue("city", dest?.cities[0] ?? "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (dest && CURRENCIES.some((c) => c.code === dest.currency)) {
      form.setValue("currency", dest.currency, { shouldDirty: true });
    }
  }

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
          <Controller
            control={form.control}
            name="country"
            render={({ field }) => (
              <Select
                items={countryItems}
                value={field.value || null}
                onValueChange={(value) => handleCountryChange(value ?? "")}
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={Boolean(form.formState.errors.country)}
                >
                  <SelectValue placeholder="국가 선택" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {countryItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field
          label="도시"
          required
          error={form.formState.errors.city?.message}
        >
          <Controller
            control={form.control}
            name="city"
            render={({ field }) => (
              <Select
                items={cityItems}
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? "")}
                disabled={!country}
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={Boolean(form.formState.errors.city)}
                >
                  <SelectValue
                    placeholder={
                      country ? "도시 선택" : "국가를 먼저 선택하세요"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {cityItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
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
          <Controller
            control={form.control}
            name="currency"
            render={({ field }) => {
              const currencyItems = CURRENCIES.map((currency) => ({
                value: currency.code,
                label: currency.label,
              }));
              return (
                <Select
                  items={currencyItems}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyItems.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
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
