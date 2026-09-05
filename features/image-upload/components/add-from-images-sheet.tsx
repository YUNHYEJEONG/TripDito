"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Images, Loader2, Sparkles, Trash2 } from "lucide-react";
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
import { useTrip } from "@/features/trips/hooks/use-trips";

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
  const proposed = job?.status === "done" ? job.items : [];

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
    try {
      // 분석용(1600px) 사진을 품목 썸네일 프리셋으로 줄여 저장. 같은 사진은 한 번만 변환
      const thumbs = new Map<string, string>();
      for (const item of proposed) {
        if (item.imageDataUrl && !thumbs.has(item.sourceImageId)) {
          thumbs.set(
            item.sourceImageId,
            await recompressDataUrl(item.imageDataUrl, IMAGE_PRESETS.item),
          );
        }
      }
      await createMany.mutateAsync(
        proposed.map((item) => ({
          name: item.name,
          estimatedPrice: item.estimatedPrice,
          quantity: item.quantity,
          memo: item.memo,
          imageDataUrl: thumbs.get(item.sourceImageId) ?? item.imageDataUrl,
          plannedPurchaseDate: null,
          giftTags: [],
        })),
      );
      toast.success(`${proposed.length}개 상품을 추가했습니다`);
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
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>
            {step === "pick" ? "사진으로 추가" : "분석 결과 확인"}
          </SheetTitle>
          <SheetDescription>
            {step === "pick"
              ? "사진에서 상품과 가격을 자동으로 찾아냅니다. 분석은 백그라운드에서 진행돼요."
              : proposed.length
                ? "상품 정보를 수정한 뒤 리스트에 추가하세요."
                : "사진에서 상품을 찾지 못했어요. 다른 사진으로 다시 시도해 보세요."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-6 pb-2">
          {step === "pick" ? (
            <>
              {running ? (
                <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2.5 text-[13px] text-primary">
                  <Loader2 className="size-4 animate-spin" />
                  사진 {job.completed}/{job.images.length}장 분석 중… 끝나면 알려드릴게요
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
                    <div key={image.id} className="relative aspect-square overflow-hidden rounded-xl">
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
                  사진 {job.failedImageIds.length}장은 분석하지 못했어요. 나머지 결과만 표시합니다.
                </p>
              ) : null}
              {proposed.map((item, index) => (
                <div
                  key={`${item.sourceImageId}-${index}`}
                  className="flex gap-3 rounded-2xl bg-muted/60 p-3"
                >
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
                      onChange={(e) => updateProposed(index, { name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={item.estimatedPrice}
                        onChange={(e) =>
                          updateProposed(index, {
                            estimatedPrice: Number(e.target.value) || 0,
                          })
                        }
                      />
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateProposed(index, {
                            quantity: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
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
                disabled={createMany.isPending || !proposed.length}
                onClick={() => void handleSave()}
              >
                {createMany.isPending ? <Loader2 className="animate-spin" /> : null}
                리스트에 추가
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
