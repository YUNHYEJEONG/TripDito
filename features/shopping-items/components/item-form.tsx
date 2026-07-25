"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/common/field-label";
import { defaultItemFormValues } from "../constants";
import {
  shoppingItemFormSchema,
  type ShoppingItemFormValues,
} from "../schema";

export function ItemForm({
  defaultValues,
  submitLabel = "저장",
  onSubmit,
  onCancel,
}: {
  defaultValues?: Partial<ShoppingItemFormValues>;
  submitLabel?: string;
  onSubmit: (values: ShoppingItemFormValues) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const form = useForm<ShoppingItemFormValues>({
    resolver: zodResolver(shoppingItemFormSchema),
    defaultValues: { ...defaultItemFormValues, ...defaultValues },
  });

  const imageDataUrl = form.watch("imageDataUrl");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
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
