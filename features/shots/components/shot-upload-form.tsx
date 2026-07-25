"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SheetCloseHeader } from "@/components/common/sheet-close-header";
import { FieldLabel } from "@/components/common/field-label";
import { compressImageFiles } from "@/features/image-upload/utils/compress-image";
import { useTrips } from "@/features/trips/hooks/use-trips";
import { useItems } from "@/features/shopping-items/hooks/use-items";
import { createId } from "@/lib/storage/id";
import { cn } from "@/lib/utils";
import { MAX_SHOT_IMAGES } from "../constants";
import { useMouseDragScroll } from "../hooks/use-mouse-drag-scroll";
import {
  shotFormSchema,
  type ImagePin,
  type ShotFormValues,
} from "../schema";

const EMPTY_FORM_VALUES: ShotFormValues = {
  channel: "shots",
  tripId: "",
  images: [],
  body: "",
  pins: [],
  shoppingItemIds: [],
};

function formatTripOptionLabel(startDate: string, city: string) {
  if (!startDate) return city;
  const [y, m, d] = startDate.split("-");
  if (!y || !m || !d) return `${startDate} ${city}`;
  return `${y}.${m}.${d} ${city}`;
}

export function ShotUploadForm({
  onSubmit,
  formId = "shot-upload-form",
  defaultValues: initialValues,
}: {
  onSubmit: (values: ShotFormValues) => Promise<void> | void;
  formId?: string;
  defaultValues?: Partial<ShotFormValues>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pinScrollerRef = useRef<HTMLDivElement>(null);
  const { data: trips = [] } = useTrips();
  const [pinImageIndex, setPinImageIndex] = useState(0);
  const [pinDraft, setPinDraft] = useState<{
    xPct: number;
    yPct: number;
  } | null>(null);
  const [pinText, setPinText] = useState("");
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const form = useForm<ShotFormValues>({
    resolver: zodResolver(shotFormSchema),
    defaultValues: { ...EMPTY_FORM_VALUES, ...initialValues },
  });

  const channel = form.watch("channel");
  const tripId = form.watch("tripId");
  const images = form.watch("images");
  const pins = form.watch("pins") ?? [];
  const shoppingItemIds = form.watch("shoppingItemIds") ?? [];

  const { data: items = [] } = useItems(tripId);

  useMouseDragScroll(pinScrollerRef, images.length > 1);

  useEffect(() => {
    setPinDraft(null);
  }, [pinImageIndex]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const remaining = MAX_SHOT_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`이미지는 최대 ${MAX_SHOT_IMAGES}장까지 가능합니다`);
      return;
    }
    setCompressing(true);
    try {
      const compressed = await compressImageFiles(
        [...files].slice(0, remaining),
      );
      form.setValue("images", [...images, ...compressed.map((c) => c.dataUrl)], {
        shouldValidate: true,
      });
      if (images.length === 0 && compressed.length > 0) {
        setPinImageIndex(0);
      }
    } catch {
      toast.error("이미지 처리에 실패했습니다");
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index);
    form.setValue("images", next, { shouldValidate: true });
    form.setValue(
      "pins",
      pins
        .filter((pin) => pin.imageIndex !== index)
        .map((pin) =>
          pin.imageIndex > index
            ? { ...pin, imageIndex: pin.imageIndex - 1 }
            : pin,
        ),
      { shouldValidate: true },
    );
    setPinImageIndex((prev) => Math.min(prev, Math.max(0, next.length - 1)));
    setPinDraft(null);
  }

  function selectPinImage(index: number) {
    setPinImageIndex(index);
    setPinDraft(null);
    const el = pinScrollerRef.current;
    const slide = el?.firstElementChild as HTMLElement | null;
    const slideWidth = slide?.getBoundingClientRect().width ?? el?.clientWidth;
    if (el && slideWidth) {
      el.scrollTo({ left: index * slideWidth, behavior: "smooth" });
    }
  }

  function handlePinScroll() {
    const el = pinScrollerRef.current;
    if (!el) return;
    const slide = el.firstElementChild as HTMLElement | null;
    const slideWidth = slide?.getBoundingClientRect().width ?? el.clientWidth;
    if (!slideWidth) return;
    const next = Math.round(el.scrollLeft / slideWidth);
    const clamped = Math.min(Math.max(next, 0), images.length - 1);
    setPinImageIndex((prev) => {
      if (prev === clamped) return prev;
      return clamped;
    });
  }

  function handleImageTap(e: React.MouseEvent<HTMLDivElement>) {
    if (pinScrollerRef.current?.dataset.dragMoved) return;
    if (!images[pinImageIndex]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setPinDraft({
      xPct: Math.min(95, Math.max(5, xPct)),
      yPct: Math.min(95, Math.max(5, yPct)),
    });
    setPinText("");
  }

  function confirmPin() {
    if (!pinDraft || !pinText.trim()) return;
    const pin: ImagePin = {
      id: createId(),
      imageIndex: pinImageIndex,
      xPct: pinDraft.xPct,
      yPct: pinDraft.yPct,
      text: pinText.trim(),
    };
    form.setValue("pins", [...pins, pin], { shouldValidate: true });
    setPinDraft(null);
    setPinText("");
  }

  function toggleShoppingItem(itemId: string) {
    const set = new Set(shoppingItemIds);
    if (set.has(itemId)) set.delete(itemId);
    else set.add(itemId);
    form.setValue("shoppingItemIds", [...set], { shouldValidate: true });
  }

  const currentPins = pins.filter((pin) => pin.imageIndex === pinImageIndex);

  return (
    <form
      id={formId}
      className="flex flex-col gap-5"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit({
          ...values,
          shoppingItemIds:
            values.channel === "shots" ? values.shoppingItemIds : [],
          pins: values.channel === "shots" ? values.pins : [],
          body: values.body?.trim() ?? "",
        });
      })}
    >
      <Field label="업로드 위치" required>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "shots", label: "때샷구경" },
              { value: "community", label: "커뮤니티" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                "rounded-xl border px-3 py-2.5 text-[14px] font-semibold transition-colors",
                channel === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-[#E5E8EB] bg-background text-foreground",
              )}
              onClick={() => {
                form.setValue("channel", option.value, {
                  shouldValidate: true,
                });
                if (option.value === "community") {
                  form.setValue("shoppingItemIds", [], {
                    shouldValidate: true,
                  });
                  form.setValue("pins", [], { shouldValidate: true });
                  setPinDraft(null);
                  setPinText("");
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label="내 여행지"
        required
        error={form.formState.errors.tripId?.message}
      >
        {trips.length === 0 ? (
          <p className="rounded-xl bg-[#F2F4F6] px-3 py-3 text-[13px] text-muted-foreground">
            등록된 여행이 없습니다. 홈에서 여행을 먼저 만들어 주세요.
          </p>
        ) : (
          <div className="relative">
            <select
              className="h-10 w-full appearance-none rounded-xl border border-transparent bg-input py-1 pr-10 pl-3 text-[13px] shadow-neu-inset outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              {...form.register("tripId")}
            >
              <option value="">여행지 선택</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {formatTripOptionLabel(trip.startDate, trip.city)}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
        )}
      </Field>

      <Field
        label={channel === "shots" ? "때샷 이미지" : "이미지"}
        required
        trailing={
          <span className="text-[12px] text-muted-foreground tabular-nums">
            최대 {MAX_SHOT_IMAGES}장 · {images.length}/{MAX_SHOT_IMAGES}
          </span>
        }
        error={form.formState.errors.images?.message as string | undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <div className="flex flex-wrap gap-2">
          {images.map((src, index) => (
            <div
              key={`${index}-${src.slice(0, 20)}`}
              className={cn(
                "relative size-20 overflow-hidden rounded-xl border-2",
                pinImageIndex === index
                  ? "border-primary"
                  : "border-transparent",
              )}
            >
              <button
                type="button"
                className="size-full"
                onClick={() => selectPinImage(index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="size-full object-cover" />
              </button>
              <button
                type="button"
                aria-label="이미지 삭제"
                className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/55 text-white"
                onClick={() => removeImage(index)}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {images.length < MAX_SHOT_IMAGES ? (
            <button
              type="button"
              disabled={compressing}
              onClick={() => fileInputRef.current?.click()}
              className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#CFD4DA] bg-[#F2F4F6] text-[#848C94]"
            >
              <ImagePlus className="size-5" />
              <span className="text-[10px] font-medium">
                {compressing ? "처리 중" : "추가"}
              </span>
            </button>
          ) : null}
        </div>
      </Field>

      {images.length > 0 && channel === "shots" ? (
        <Field label="이미지 코멘트">
          <p className="mb-2 text-[12px] text-muted-foreground">
            이미지를 탭하고 코멘트를 달아보세요.
          </p>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#F2F4F6]">
            <div
              ref={pinScrollerRef}
              className={cn(
                "flex size-full snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                images.length > 1 && "cursor-grab select-none",
              )}
              onScroll={handlePinScroll}
            >
              {images.map((src, index) => (
                <div
                  key={`${index}-${src.slice(0, 16)}`}
                  className="relative aspect-square min-w-full shrink-0 basis-full snap-start"
                  onClick={index === pinImageIndex ? handleImageTap : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="pointer-events-none size-full object-cover"
                    draggable={false}
                  />
                  {index === pinImageIndex
                    ? currentPins.map((pin) => (
                        <button
                          key={pin.id}
                          type="button"
                          className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-primary text-white shadow-md"
                          style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            form.setValue(
                              "pins",
                              pins.filter((p) => p.id !== pin.id),
                              { shouldValidate: true },
                            );
                          }}
                          aria-label="핀 삭제"
                        >
                          <Plus className="size-4" strokeWidth={2.5} />
                        </button>
                      ))
                    : null}
                  {index === pinImageIndex && pinDraft ? (
                    <span
                      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-primary/80 text-white"
                      style={{
                        left: `${pinDraft.xPct}%`,
                        top: `${pinDraft.yPct}%`,
                      }}
                    >
                      <Plus className="size-4" strokeWidth={2.5} />
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            {images.length > 1 ? (
              <>
                <span className="absolute top-3 right-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white tabular-nums">
                  {pinImageIndex + 1}/{images.length}
                </span>
                <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full shadow-sm transition-all",
                        i === pinImageIndex
                          ? "w-4 bg-white"
                          : "w-1.5 bg-white/50",
                      )}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
          {pinDraft ? (
            <div className="mt-2 flex flex-col gap-2">
              <Textarea
                value={pinText}
                onChange={(e) => setPinText(e.target.value)}
                placeholder="생생한 코멘트를 남겨보세요!"
                rows={2}
                className="min-h-16"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setPinDraft(null)}
                >
                  취소
                </Button>
                <Button type="button" size="sm" onClick={confirmPin}>
                  추가
                </Button>
              </div>
            </div>
          ) : null}
          {pins.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {pins.map((pin) => (
                <li
                  key={pin.id}
                  className="flex items-center gap-2 rounded-lg bg-[#F2F4F6] px-2.5 py-2 text-[12px]"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-1.5">
                    <span className="shrink-0 font-semibold text-primary">
                      사진 {pin.imageIndex + 1}
                    </span>
                    <span className="min-w-0 flex-1 break-words whitespace-pre-wrap text-foreground">
                      {pin.text}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label="핀 삭제"
                    className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background"
                    onClick={() =>
                      form.setValue(
                        "pins",
                        pins.filter((p) => p.id !== pin.id),
                        { shouldValidate: true },
                      )
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </Field>
      ) : null}

      <Field label="피드">
        <Controller
          control={form.control}
          name="body"
          render={({ field }) => (
            <Textarea
              {...field}
              value={field.value ?? ""}
              placeholder="내용을 입력해주세요."
              rows={4}
              className="min-h-20"
            />
          )}
        />
      </Field>

      {channel === "shots" ? (
        <Field
          label="쇼핑리스트"
          description={
            !tripId ? "내 여행지를 우선 선택해주세요." : undefined
          }
        >
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            disabled={!tripId}
            onClick={() => setShoppingOpen(true)}
          >
            <Plus className="size-4" />
            쇼핑리스트 선택
            {shoppingItemIds.length > 0
              ? ` · ${shoppingItemIds.length}개 선택`
              : ""}
          </Button>
        </Field>
      ) : null}

      <Sheet open={shoppingOpen} onOpenChange={setShoppingOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="mx-auto max-h-[75vh] max-w-[480px] rounded-t-2xl md:max-w-[720px] lg:max-w-[960px]"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#D1D5DB]" />
          <SheetCloseHeader
            title="쇼핑리스트 선택"
            onClose={() => setShoppingOpen(false)}
          />
          <ul className="mt-3 flex max-h-[55vh] flex-col gap-2 overflow-y-auto px-4 pb-6">
            {items.length === 0 ? (
              <li className="py-8 text-center text-[13px] text-muted-foreground">
                이 여행에 등록된 상품이 없습니다
              </li>
            ) : (
              items.map((item) => {
                const checked = shoppingItemIds.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleShoppingItem(item.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                        checked
                          ? "border-primary bg-primary/10"
                          : "border-transparent bg-[#F2F4F6]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded border text-[11px]",
                          checked
                            ? "border-primary bg-primary text-white"
                            : "border-[#CFD4DA] bg-white",
                        )}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium">
                        {item.name}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <div className="border-t border-[#EAEDED] px-4 py-3">
            <Button
              type="button"
              className="w-full"
              onClick={() => setShoppingOpen(false)}
            >
              완료 ({shoppingItemIds.length})
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  trailing,
  description,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  trailing?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel required={required}>{label}</FieldLabel>
        {trailing}
      </div>
      {description ? (
        <p className="text-[12px] text-muted-foreground">{description}</p>
      ) : null}
      {children}
      {error ? (
        <p className="text-[12px] text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
