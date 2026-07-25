"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldLabel } from "@/components/common/field-label";
import { defaultItemFormValues } from "../constants";
import { GIFT_TAG_OPTIONS, type GiftTagId } from "../constants/gift-tags";
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
    defaultValues: {
      ...defaultItemFormValues,
      ...defaultValues,
      giftTags: defaultValues?.giftTags ?? defaultItemFormValues.giftTags,
    },
  });

  const imageDataUrl = form.watch("imageDataUrl");
  const giftTags = form.watch("giftTags") ?? [];

  function toggleGiftTag(id: GiftTagId) {
    const next = giftTags.includes(id)
      ? giftTags.filter((tag) => tag !== id)
      : [...giftTags, id];
    form.setValue("giftTags", next, { shouldDirty: true, shouldValidate: true });
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
        <Input
          type="date"
          value={form.watch("plannedPurchaseDate") ?? ""}
          onChange={(event) => {
            form.setValue(
              "plannedPurchaseDate",
              event.target.value ? event.target.value : null,
              { shouldDirty: true, shouldValidate: true },
            );
          }}
        />
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
