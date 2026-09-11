"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Images,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  compressImageFiles,
  IMAGE_PRESETS,
  recompressDataUrl,
  type CompressedImage,
} from "../utils/compress-image";
import {
  analysisJobs,
  useAnalysisJob,
} from "@/features/image-analysis/store/analysis-jobs";
import type { ProposedItem } from "@/features/image-analysis/port";
import { useCreateManyItems } from "@/features/shopping-items/hooks/use-items";
import {
  StoreSuggest,
  appendPlace,
} from "@/features/shopping-items/components/store-suggest";
import { useTrip } from "@/features/trips/hooks/use-trips";

const EMPTY_SET: ReadonlySet<number> = new Set<number>();

const PRICE_SOURCE_HINT: Record<ProposedItem["priceSource"], string> = {
  image: "사진에 적힌 가격이에요",
  search: "쇼핑 검색 결과의 중간값이에요",
  estimate: "AI가 추정한 대략적인 현지 가격이에요. 확인 후 수정해 주세요",
  none: "가격을 찾지 못했어요. 직접 입력해 주세요",
};

/** 개수 -/+ 스테퍼. 0 이 되면 상위에서 선택 해제로 처리한다 */
function QuantityStepper({
  value,
  label,
  onChange,
}: {
  value: number;
  label: string;
  onChange: (next: number) => void;
}) {
  const buttonClass =
    "flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-foreground transition-colors hover:bg-secondary active:bg-secondary disabled:opacity-40";
  return (
    <div
      className="flex h-10 items-center justify-between rounded-lg bg-input/90 px-1"
      role="group"
      aria-label={`${label} 개수`}
    >
      <button
        type="button"
        aria-label="개수 줄이기"
        className={buttonClass}
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="size-4" />
      </button>
      <span
        className="min-w-8 text-center text-[14px] font-semibold tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="개수 늘리기"
        className={buttonClass}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/**
 * 사진으로 상품 추가.
 * 분석은 전역 스토어(analysisJobs)에서 백그라운드로 돌고, 이 시트는 사진 고르기와 결과 검토만 맡는다.
 * 시트를 닫아도 분석은 계속되며, 끝나면 배너/토스트가 "결과 보기"로 다시 열어 준다.
 */
export function AddFromImagesSheet({
  tripId,
  open,
  onOpenChange,
}: {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<CompressedImage[]>([]);
  const createMany = useCreateManyItems(tripId);
  const { data: trip } = useTrip(tripId);
  const job = useAnalysisJob(tripId);

  const running = job?.status === "running";
  const step: "pick" | "review" = job?.status === "done" ? "review" : "pick";
  const proposed = useMemo(
    () => (job?.status === "done" ? job.items : []),
    [job],
  );

  // 분석 결과 중 리스트에 넣을 항목(체크). 결과 묶음(job)이 바뀌면 전부 체크 상태로 되돌린다
  const [exclusion, setExclusion] = useState<{
    key: unknown;
    set: Set<number>;
  }>({ key: null, set: new Set() });
  const excluded: ReadonlySet<number> =
    exclusion.key === job ? exclusion.set : EMPTY_SET;
  const setExcluded = (update: (prev: ReadonlySet<number>) => Set<number>) =>
    setExclusion({ key: job, set: update(excluded) });
  const selectedCount = useMemo(
    () => proposed.filter((_, index) => !excluded.has(index)).length,
    [proposed, excluded],
  );
  const allSelected = proposed.length > 0 && selectedCount === proposed.length;

  function toggleSelected(index: number, checked: boolean) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (checked) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setExcluded(() =>
      checked ? new Set() : new Set(proposed.map((_, i) => i)),
    );
  }

  // 배너의 "결과 보기" → 시트 열기
  useEffect(() => {
    if (job?.reviewRequested) {
      onOpenChange(true);
      analysisJobs.acknowledgeReview(tripId);
    }
  }, [job?.reviewRequested, tripId, onOpenChange]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    try {
      const compressed = await compressImageFiles(
        Array.from(fileList),
        IMAGE_PRESETS.analysis,
      );
      if (!compressed.length) {
        toast.error("이미지 파일만 업로드할 수 있습니다");
        return;
      }
      setImages((prev) => [...prev, ...compressed]);
    } catch {
      toast.error("이미지 처리에 실패했습니다");
    }
  }

  function handleAnalyze() {
    if (!images.length) return;
    const started = analysisJobs.start(tripId, trip?.name ?? "여행", images);
    if (!started) {
      toast.error("이미 분석이 진행 중입니다");
      return;
    }
    setImages([]);
    onOpenChange(false);
    toast.info("사진을 분석하고 있어요!", {
      description: "완료되면 알려드릴게요",
    });
  }

  function updateProposed(index: number, patch: Partial<ProposedItem>) {
    analysisJobs.updateItems(
      tripId,
      proposed.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function handleRestart() {
    analysisJobs.clear(tripId);
  }

  async function handleSave() {
    const picked = proposed.filter((_, index) => !excluded.has(index));
    if (!picked.length) return;
    try {
      // 분석용(1600px) 사진을 품목 썸네일 프리셋으로 줄여 저장. 같은 사진은 한 번만 변환
      const thumbs = new Map<string, string>();
      for (const item of picked) {
        if (item.imageDataUrl && !thumbs.has(item.sourceImageId)) {
          thumbs.set(
            item.sourceImageId,
            await recompressDataUrl(item.imageDataUrl, IMAGE_PRESETS.item),
          );
        }
      }
      await createMany.mutateAsync(
        picked.map((item) => ({
          name: item.name,
          estimatedPrice: item.estimatedPrice,
          quantity: item.quantity,
          memo: item.memo,
          purchasePlace: item.purchasePlace,
          imageDataUrl: thumbs.get(item.sourceImageId) ?? item.imageDataUrl,
          plannedPurchaseDate: null,
          giftTags: [],
        })),
      );
      toast.success(`${picked.length}개 상품을 추가했습니다`);
      analysisJobs.clear(tripId);
      onOpenChange(false);
    } catch {
      toast.error("저장에 실패했습니다");
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setImages([]);
        onOpenChange(next);
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-3xl"
      >
        <SheetHeader>
          <SheetTitle>
            {step === "pick" ? "사진으로 추가" : "분석 결과 확인"}
          </SheetTitle>
          <SheetDescription>
            {step === "pick"
              ? "사진에서 상품과 가격을 자동으로 찾아냅니다. 분석은 백그라운드에서 진행돼요."
              : proposed.length
                ? "체크한 상품만 리스트에 추가돼요. 정보는 바로 수정할 수 있어요."
                : "사진에서 상품을 찾지 못했어요. 다른 사진으로 다시 시도해 보세요."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-6 pb-2">
          {step === "pick" ? (
            <>
              {running ? (
                <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2.5 text-[13px] text-primary">
                  <Loader2 className="size-4 animate-spin" />
                  사진 {job.completed}/{job.images.length}장 분석 중… 끝나면
                  알려드릴게요
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12"
                  onClick={() => galleryRef.current?.click()}
                >
                  <Images />
                  앨범
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12"
                  onClick={() => cameraRef.current?.click()}
                >
                  <Camera />
                  카메라
                </Button>
              </div>
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  void handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {images.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-square overflow-hidden rounded-xl"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.dataUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white"
                        onClick={() =>
                          setImages((prev) =>
                            prev.filter((item) => item.id !== image.id),
                          )
                        }
                        aria-label="삭제"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  이미지를 선택하세요
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              {job?.failedImageIds.length ? (
                <p className="rounded-xl bg-muted/60 px-3 py-2 text-[12px] text-muted-foreground">
                  사진 {job.failedImageIds.length}장은 분석하지 못했어요. 나머지
                  결과만 표시합니다.
                </p>
              ) : null}
              {proposed.length ? (
                <label className="flex items-center gap-2 px-1 text-[13px] font-medium text-foreground">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={selectedCount > 0 && !allSelected}
                    onCheckedChange={(checked) => toggleAll(checked === true)}
                    aria-label="전체 선택"
                  />
                  전체 선택
                  <span className="ml-auto text-[12px] font-normal text-muted-foreground">
                    {selectedCount}/{proposed.length}개 선택
                  </span>
                </label>
              ) : null}
              {proposed.map((item, index) => {
                const checked = !excluded.has(index);
                return (
                  <div
                    key={`${item.sourceImageId}-${index}`}
                    data-checked={checked}
                    className="flex gap-3 rounded-2xl bg-muted/60 p-3 transition-opacity data-[checked=false]:opacity-55"
                  >
                    <div className="flex shrink-0 flex-col items-center gap-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) =>
                          toggleSelected(index, next === true)
                        }
                        aria-label={`${item.name || "상품"} 리스트에 추가`}
                        className="size-5 rounded-md"
                      />
                    </div>
                    <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-background">
                      {item.imageDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageDataUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Input
                        value={item.name}
                        onChange={(e) =>
                          updateProposed(index, { name: e.target.value })
                        }
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          aria-label="예상 가격"
                          title={PRICE_SOURCE_HINT[item.priceSource]}
                          value={item.estimatedPrice}
                          onChange={(e) =>
                            updateProposed(index, {
                              estimatedPrice: Number(e.target.value) || 0,
                            })
                          }
                        />
                        <QuantityStepper
                          value={checked ? item.quantity : 0}
                          label={item.name || "상품"}
                          onChange={(next) => {
                            // 0개 = 선택 해제, 다시 올리면 1개로 선택
                            if (next <= 0) {
                              toggleSelected(index, false);
                              return;
                            }
                            if (!checked) toggleSelected(index, true);
                            updateProposed(index, { quantity: next });
                          }}
                        />
                      </div>
                      <div className="relative">
                        <MapPin
                          className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
                          aria-hidden
                        />
                        <Input
                          aria-label="구매 장소"
                          placeholder="구매 장소 (예: 돈키호테)"
                          className="pl-8"
                          value={item.purchasePlace}
                          onChange={(e) =>
                            updateProposed(index, {
                              purchasePlace: e.target.value,
                            })
                          }
                        />
                      </div>
                      <StoreSuggest
                        compact
                        tripId={tripId}
                        productName={item.name}
                        onPick={(store) =>
                          updateProposed(index, {
                            purchasePlace: appendPlace(
                              item.purchasePlace,
                              store.name,
                            ),
                          })
                        }
                      />
                      {item.priceSource === "estimate" ||
                      item.priceSource === "none" ? (
                        <p className="text-[11px] text-muted-foreground">
                          {PRICE_SOURCE_HINT[item.priceSource]}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <SheetFooter>
          {step === "pick" ? (
            <Button
              disabled={!images.length || running}
              onClick={handleAnalyze}
            >
              {running ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {running ? "분석 중…" : "사진 분석"}
            </Button>
          ) : (
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="sm:flex-1"
                onClick={handleRestart}
              >
                다시 선택
              </Button>
              <Button
                className="sm:flex-1"
                disabled={createMany.isPending || !selectedCount}
                onClick={() => void handleSave()}
              >
                {createMany.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : null}
                {selectedCount
                  ? `${selectedCount}개 리스트에 추가`
                  : "리스트에 추가"}
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
