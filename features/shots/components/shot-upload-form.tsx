"use client";

import { useRef, useState } from "react";
import NextImage from "next/image";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useUnsavedChanges } from "@/lib/navigation/unsaved-changes";

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

function firstErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }
  for (const value of Object.values(error)) {
    const message = firstErrorMessage(value);
    if (message) return message;
  }
  return undefined;
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

  const [
    channel,
    tripId,
    images,
    pins = [],
    shoppingItemIds = [],
    body = "",
  ] = useWatch({
    control: form.control,
    name: [
      "channel",
      "tripId",
      "images",
      "pins",
      "shoppingItemIds",
      "body",
    ],
  });

  const { data: items = [] } = useItems(tripId);
  const hasUnsavedChanges =
    form.formState.isDirty || compressing || Boolean(pinText.trim());
  useUnsavedChanges(hasUnsavedChanges);

  useMouseDragScroll(pinScrollerRef, images.length > 1);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const remaining = MAX_SHOT_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`사진은 최대 ${MAX_SHOT_IMAGES}장까지 올릴 수 있어요.`);
      return;
    }
    setCompressing(true);
    try {
      const compressed = await compressImageFiles(
        [...files].slice(0, remaining),
      );
      const currentImages = form.getValues("images");
      form.setValue(
        "images",
        [...currentImages, ...compressed.map((c) => c.dataUrl)],
        { shouldDirty: true, shouldValidate: true },
      );
      if (images.length === 0 && compressed.length > 0) {
        setPinImageIndex(0);
      }
    } catch {
      toast.error("사진을 처리하지 못했어요. 다시 선택해 주세요.");
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index);
    form.setValue("images", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue(
      "pins",
      pins
        .filter((pin) => pin.imageIndex !== index)
        .map((pin) =>
          pin.imageIndex > index
            ? { ...pin, imageIndex: pin.imageIndex - 1 }
            : pin,
        ),
      { shouldDirty: true, shouldValidate: true },
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
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      el.scrollTo({
        left: index * slideWidth,
        behavior: reduceMotion ? "auto" : "smooth",
      });
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
    if (pinImageIndex === clamped) return;
    setPinImageIndex(clamped);
    setPinDraft(null);
  }

  function handleImageTap(e: React.MouseEvent<HTMLButtonElement>) {
    if (pinScrollerRef.current?.dataset.dragMoved) return;
    if (!images[pinImageIndex]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const keyboardActivation = e.detail === 0;
    const xPct = keyboardActivation
      ? 50
      : ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = keyboardActivation
      ? 50
      : ((e.clientY - rect.top) / rect.height) * 100;
    setPinDraft({
      xPct: Math.min(92, Math.max(8, xPct)),
      yPct: Math.min(92, Math.max(8, yPct)),
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
    form.setValue("pins", [...pins, pin], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setPinDraft(null);
    setPinText("");
  }

  function toggleShoppingItem(itemId: string) {
    const set = new Set(shoppingItemIds);
    if (set.has(itemId)) set.delete(itemId);
    else set.add(itemId);
    form.setValue("shoppingItemIds", [...set], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function selectChannel(nextChannel: "shots" | "community") {
    if (channel === nextChannel) return;
    form.setValue("channel", nextChannel, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (nextChannel === "community") {
      form.setValue("shoppingItemIds", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("pins", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
      setShoppingOpen(false);
      setPinDraft(null);
      setPinText("");
    }
  }

  const currentPins = pins.filter((pin) => pin.imageIndex === pinImageIndex);

  return (
    <form
      id={formId}
      className="flex flex-col gap-5"
      data-unsaved={hasUnsavedChanges ? "true" : undefined}
      noValidate
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
      <Field label="게시 위치" required>
        <div role="group" aria-label="게시 위치" className="grid grid-cols-2 gap-2">
          {(
            [
              {
                value: "shots",
                label: "때샷",
                description: "상품 핀·리스트 연결",
              },
              {
                value: "community",
                label: "커뮤니티",
                description: "여행 이야기·팁",
              },
            ] as const
          ).map((option) => {
            const selected = channel === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => selectChannel(option.value)}
                className={cn(
                  "flex min-h-14 flex-col items-start justify-center rounded-xl border px-3 py-2 text-left outline-none transition-colors duration-120 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                  selected
                    ? "border-ink bg-ink text-paper hover:bg-ink-2 active:bg-ink-2"
                    : "border-rule bg-paper text-ink hover:bg-paper-2 active:bg-paper-3",
                )}
              >
                <span className="text-[14px] font-semibold">
                  {option.label}
                </span>
                <span
                  className={cn(
                    "mt-0.5 text-[11px]",
                    selected ? "text-paper/75" : "text-ink-2",
                  )}
                >
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="여행 선택"
        required
        errorId="shot-trip-error"
        error={form.formState.errors.tripId?.message}
      >
        {trips.length === 0 ? (
          <p className="rounded-xl bg-paper-2 px-3 py-3 text-[13px] text-ink-2">
            등록된 여행이 없어요. 여행을 만든 뒤 다시 시도해 주세요.
          </p>
        ) : (
          <Controller
            control={form.control}
            name="tripId"
            render={({ field }) => {
              const tripItems = trips.map((trip) => ({
                value: trip.id,
                label: formatTripOptionLabel(trip.startDate, trip.city),
              }));
              return (
                <Select
                  items={tripItems}
                  value={field.value || null}
                  onValueChange={(value) => {
                    const nextTripId = value ?? "";
                    if (nextTripId !== field.value) {
                      form.setValue("shoppingItemIds", [], {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setShoppingOpen(false);
                    }
                    field.onChange(nextTripId);
                  }}
                >
                  <SelectTrigger
                    aria-label="여행 선택"
                    aria-required="true"
                    aria-invalid={Boolean(form.formState.errors.tripId)}
                    aria-describedby="shot-trip-error"
                    className="w-full"
                  >
                    <SelectValue placeholder="여행지 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {tripItems.map((trip) => (
                      <SelectItem key={trip.value} value={trip.value}>
                        {trip.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
        )}
      </Field>

      <Field
        label={channel === "shots" ? "사진" : "이미지"}
        required
        errorId="shot-images-error"
        trailing={
          <span className="text-[12px] text-ink-2 tabular-nums">
            최대 {MAX_SHOT_IMAGES}장 · {images.length}/{MAX_SHOT_IMAGES}
          </span>
        }
        error={form.formState.errors.images?.message as string | undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          aria-label={
            channel === "community" ? "커뮤니티 사진 선택" : "때샷 사진 선택"
          }
          aria-required="true"
          aria-invalid={Boolean(form.formState.errors.images)}
          aria-describedby="shot-images-error"
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
                "relative size-20 overflow-hidden rounded-xl border",
                pinImageIndex === index
                  ? "border-accent"
                  : "border-transparent",
              )}
            >
              <button
                type="button"
                aria-label={`${index + 1}번째 사진 선택`}
                aria-pressed={pinImageIndex === index}
                className="size-full outline-none hover:brightness-95 active:brightness-90 focus-visible:[box-shadow:inset_0_0_0_2px_var(--color-paper),inset_0_0_0_4px_var(--color-focus)]"
                onClick={() => selectPinImage(index)}
              >
                <NextImage
                  src={src}
                  alt={`업로드한 사진 ${index + 1}`}
                  fill
                  unoptimized={src.startsWith("data:")}
                  sizes="80px"
                  className="object-cover"
                />
              </button>
              <button
                type="button"
                aria-label="이미지 삭제"
                className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-full bg-ink/65 text-paper outline-none hover:bg-ink/80 active:bg-ink focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
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
              aria-label={compressing ? "필수 사진 처리 중" : "필수 사진 추가"}
              className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-paper-3 bg-paper-2 text-ink-2 outline-none transition-colors duration-120 hover:border-control hover:bg-paper-3 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:border-paper-3 disabled:bg-paper-2 disabled:text-ink-3"
            >
              <ImagePlus className="size-5" />
              <span className="text-[12px] font-medium">
                {compressing ? "처리 중" : "추가"}
              </span>
            </button>
          ) : null}
        </div>
      </Field>

      {images.length > 0 && channel === "shots" ? (
        <Field
          label="사진에 핀 달기"
          errorId="shot-pins-error"
          error={firstErrorMessage(form.formState.errors.pins)}
        >
          <p className="mb-2 text-[12px] text-ink-2">
            사진을 탭한 위치에 상품 메모를 남길 수 있어요. 키보드는 Enter로
            핀을 만든 뒤 방향키로 옮겨요.
          </p>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-paper-2">
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
                >
                  <NextImage
                    src={src}
                    alt={`핀을 추가할 사진 ${index + 1}`}
                    fill
                    unoptimized={src.startsWith("data:")}
                    sizes="(max-width: 480px) 100dvw, 480px"
                    className="pointer-events-none object-cover"
                    draggable={false}
                  />
                  {index === pinImageIndex ? (
                    <button
                      type="button"
                      className="absolute inset-0 z-[1] outline-none transition-colors duration-120 hover:bg-paper/10 active:bg-ink/10 focus-visible:[box-shadow:inset_0_0_0_2px_var(--color-paper),inset_0_0_0_4px_var(--color-focus)]"
                      onClick={handleImageTap}
                      onKeyDown={(event) => {
                        if (!pinDraft) return;
                        const step = event.shiftKey ? 10 : 3;
                        const delta = {
                          ArrowLeft: [-step, 0],
                          ArrowRight: [step, 0],
                          ArrowUp: [0, -step],
                          ArrowDown: [0, step],
                        }[event.key];
                        if (!delta) return;
                        event.preventDefault();
                        setPinDraft((current) =>
                          current
                            ? {
                                xPct: Math.min(
                                  92,
                                  Math.max(8, current.xPct + delta[0]),
                                ),
                                yPct: Math.min(
                                  92,
                                  Math.max(8, current.yPct + delta[1]),
                                ),
                              }
                            : current,
                        );
                      }}
                      aria-label={
                        pinDraft
                          ? `${index + 1}번째 사진 핀 위치 가로 ${Math.round(pinDraft.xPct)}%, 세로 ${Math.round(pinDraft.yPct)}%. 방향키로 이동`
                          : `${index + 1}번째 사진에 핀 추가`
                      }
                    />
                  ) : null}
                  {index === pinImageIndex
                    ? currentPins.map((pin) => (
                        <button
                          key={pin.id}
                          type="button"
                          className="press-overlay absolute z-10 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent-text text-paper shadow-float outline-none hover:bg-ink focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                          style={{
                            left: `clamp(26px, ${pin.xPct}%, calc(100% - 26px))`,
                            top: `clamp(26px, ${pin.yPct}%, calc(100% - 26px))`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            form.setValue(
                              "pins",
                              pins.filter((p) => p.id !== pin.id),
                              { shouldDirty: true, shouldValidate: true },
                            );
                          }}
                          aria-label="핀 삭제"
                        >
                          <X className="size-4" strokeWidth={1.9} />
                        </button>
                      ))
                    : null}
                  {index === pinImageIndex && pinDraft ? (
                    <span
                      className="pointer-events-none absolute z-10 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent/80 text-paper"
                      style={{
                        left: `${pinDraft.xPct}%`,
                        top: `${pinDraft.yPct}%`,
                      }}
                    >
                      <Plus className="size-4" strokeWidth={1.9} />
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            {images.length > 1 ? (
              <>
                <span className="absolute top-3 right-3 z-10 rounded-full bg-ink/65 px-2 py-1 text-[11px] font-semibold text-paper tabular-nums">
                  {pinImageIndex + 1}/{images.length}
                </span>
                <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-ink/45 px-2 py-1">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full transition-opacity duration-[var(--dur-fast)]",
                        i === pinImageIndex
                          ? "w-4 bg-paper"
                          : "w-1.5 bg-paper/50",
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
                aria-label="핀 메모"
                aria-describedby="shot-pins-error"
                value={pinText}
                onChange={(e) => setPinText(e.target.value)}
                placeholder="상품이나 가격 메모"
                maxLength={200}
                rows={2}
                className="min-h-16"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-ink-2 tabular-nums">
                  {pinText.length}/200
                </span>
                <div className="flex gap-2">
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
            </div>
          ) : null}
          {pins.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {pins.map((pin) => (
                <li
                  key={pin.id}
                  className="flex items-center gap-2 rounded-lg bg-paper-2 px-2 py-2 text-[12px]"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <span className="shrink-0 font-semibold text-accent-text">
                      사진 {pin.imageIndex + 1}
                    </span>
                    <span className="min-w-0 flex-1 break-words whitespace-pre-wrap text-ink">
                      {pin.text}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label="핀 삭제"
                    className="flex size-11 shrink-0 items-center justify-center rounded-md text-ink-2 outline-none transition-colors duration-120 hover:bg-paper active:bg-paper focus-visible:ring-2 focus-visible:ring-focus"
                    onClick={() =>
                      form.setValue(
                        "pins",
                        pins.filter((p) => p.id !== pin.id),
                        { shouldDirty: true, shouldValidate: true },
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

      {channel === "shots" ? (
        <Field
          label="리스트 연결"
          description={!tripId ? "여행을 먼저 선택해 주세요." : undefined}
        >
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            disabled={!tripId}
            onClick={() => setShoppingOpen(true)}
          >
            <Plus className="size-4" />
            연결할 상품 선택
            {shoppingItemIds.length > 0
              ? ` · ${shoppingItemIds.length}개 선택`
              : ""}
          </Button>
        </Field>
      ) : null}

      <Field
        label="본문"
        trailing={
          <span className="text-[12px] text-ink-2 tabular-nums">
            {body.length}/2,000
          </span>
        }
        errorId="shot-body-error"
        error={form.formState.errors.body?.message}
      >
        <Controller
          control={form.control}
          name="body"
          render={({ field }) => (
            <Textarea
              {...field}
              aria-label="본문"
              aria-describedby="shot-body-error"
              value={field.value ?? ""}
              placeholder={
                channel === "community"
                  ? "여행 팁이나 쇼핑 동선을 나눠보세요"
                  : "사진과 함께 남길 내용"
              }
              maxLength={2000}
              rows={4}
              className="min-h-20"
            />
          )}
        />
      </Field>

      <Sheet open={shoppingOpen} onOpenChange={setShoppingOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="mx-auto max-h-[75dvh] max-w-[480px] rounded-t-2xl"
        >
          <SheetCloseHeader
            title="쇼핑리스트 선택"
            onClose={() => setShoppingOpen(false)}
          />
          <ul className="mt-3 flex max-h-[55dvh] flex-col gap-2 overflow-y-auto px-4 pb-6">
            {items.length === 0 ? (
              <li className="py-8 text-center text-[13px] text-ink-2">
                이 여행에 등록된 상품이 없어요
              </li>
            ) : (
              items.map((item) => {
                const checked = shoppingItemIds.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={checked}
                      onClick={() => toggleShoppingItem(item.id)}
                      className={cn(
                        "flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-3 text-left outline-none transition-colors duration-120 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                        checked
                          ? "border-accent bg-accent/10 hover:bg-accent/15 active:bg-accent/20"
                          : "border-transparent bg-paper-2 hover:bg-paper-3 active:bg-paper-3",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded border text-[11px]",
                          checked
                            ? "border-accent-text bg-accent-text text-paper"
                            : "border-paper-3 bg-paper",
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
          <div className="border-t border-rule px-4 py-3">
            <Button
              type="button"
              className="w-full"
              onClick={() => setShoppingOpen(false)}
            >
              선택 완료 · {shoppingItemIds.length}개
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
  errorId,
  trailing,
  description,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  errorId?: string;
  trailing?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel required={required}>{label}</FieldLabel>
        {trailing}
      </div>
      {description ? (
        <p className="text-[12px] text-ink-2">{description}</p>
      ) : null}
      {children}
      <p
        id={errorId}
        className="min-h-5 text-[12px] leading-5 text-ink"
        aria-live="polite"
      >
        {error ?? <span aria-hidden>&nbsp;</span>}
      </p>
    </div>
  );
}
