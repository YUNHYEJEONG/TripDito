"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Camera, Images, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "@/components/common/toast-alert";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { SheetCloseHeader } from "@/components/common/sheet-close-header";
import {
  Sheet,
  SheetContent,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCurrency } from "@/config/currencies";
import { compressImageFiles, type CompressedImage } from "../utils/compress-image";
import type { ProposedItem } from "@/features/image-analysis/port";
import {
  useClearAnalysisJob,
  useStartAnalysisJob,
} from "@/features/image-analysis/hooks/use-analysis-job";
import { useCreateManyItems } from "@/features/shopping-items/hooks/use-items";

type Step = "pick" | "review";

const BACKGROUND_IMAGE_THRESHOLD = 3;

function parseStores(value: string): string[] {
  return value
    .split(/[,，·/|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function AddFromImagesSheet({
  tripId,
  city,
  country,
  currency,
  open,
  onOpenChange,
  /** 백그라운드 잡 완료 후 결과 재오픈 */
  reviewProposed,
  fromBackgroundJob = false,
}: {
  tripId: string;
  city: string;
  country: string;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewProposed?: ProposedItem[] | null;
  fromBackgroundJob?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("pick");
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [proposed, setProposed] = useState<ProposedItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [bgAlertOpen, setBgAlertOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const createMany = useCreateManyItems(tripId);
  const startJob = useStartAnalysisJob();
  const clearJob = useClearAnalysisJob();
  const currencyMeta = getCurrency(currency);
  const isJobReview = fromBackgroundJob && step === "review";

  function reset() {
    setStep("pick");
    setImages([]);
    setProposed([]);
    setAnalyzing(false);
    setBgAlertOpen(false);
    setDiscardConfirmOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    if (reviewProposed?.length) {
      setProposed(reviewProposed);
      setStep("review");
      setImages([]);
      setAnalyzing(false);
    }
  }, [open, reviewProposed]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    try {
      const compressed = await compressImageFiles(Array.from(fileList));
      if (!compressed.length) {
        toast.error("이미지 파일만 업로드할 수 있습니다.");
        return;
      }
      setImages((prev) => [...prev, ...compressed]);
    } catch {
      toast.error("이미지 처리에 실패했습니다");
    }
  }

  function handleAnalyzeClick() {
    if (!images.length) return;
    if (images.length >= BACKGROUND_IMAGE_THRESHOLD) {
      setBgAlertOpen(true);
      return;
    }
    void handleAnalyzeInline();
  }

  async function confirmBackgroundAnalyze() {
    try {
      await startJob.mutateAsync({
        tripId,
        images: images.map((image) => ({
          id: image.id,
          dataUrl: image.dataUrl,
          fileName: image.fileName,
        })),
        context: { city, country, currency },
      });
      setBgAlertOpen(false);
      reset();
      onOpenChange(false);
      if (pathname !== "/home") {
        router.push("/home");
      }
    } catch {
      toast.error("분석을 시작하지 못했습니다");
    }
  }

  async function handleAnalyzeInline() {
    if (!images.length) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/image-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: images.map((image) => ({
            id: image.id,
            dataUrl: image.dataUrl,
            fileName: image.fileName,
          })),
          context: { city, country, currency },
        }),
      });
      const body = (await res.json()) as {
        items?: ProposedItem[];
        error?: string;
        provider?: string;
        warnings?: string[];
      };
      if (!res.ok || !body.items) {
        throw new Error(body.error ?? `HTTP_${res.status}`);
      }
      setProposed(body.items);
      setStep("review");
      if (body.provider === "catalog") {
        toast.warning(
          body.warnings?.length
            ? "AI 분석에 실패해 데모 결과로 대체했어요. API 키를 확인해주세요."
            : "데모 분석입니다. Gemini API 키를 확인해주세요.",
        );
      } else if (body.warnings?.length) {
        toast.message("일부 보조 검색이 실패했지만 분석은 완료됐어요.");
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "디토 AI 분석에 실패했습니다";
      toast.error(
        message.length > 120
          ? "디토 AI 분석에 실패했습니다. API 키를 확인해주세요."
          : message,
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    try {
      await createMany.mutateAsync(
        proposed.map((item) => ({
          name: item.name,
          estimatedPrice: item.estimatedPrice,
          quantity: item.quantity,
          memo: item.memo,
          imageDataUrl: item.imageDataUrl,
          plannedPurchaseDates: [],
          giftTags: [],
          localName: item.localName || null,
          expectedStores: item.expectedStores,
          favorited: false,
        })),
      );
      toast.success(`${proposed.length}개 상품을 추가했습니다`);
      if (fromBackgroundJob) {
        await clearJob.mutateAsync();
      }
      reset();
      onOpenChange(false);
    } catch {
      toast.error("저장에 실패했습니다");
    }
  }

  function patchProposed(index: number, patch: Partial<ProposedItem>) {
    setProposed((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  async function handleClose() {
    if (isJobReview) {
      setDiscardConfirmOpen(true);
      return;
    }
    reset();
    onOpenChange(false);
  }

  async function confirmDiscard() {
    if (fromBackgroundJob) {
      await clearJob.mutateAsync();
    }
    reset();
    onOpenChange(false);
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            if (isJobReview) {
              setDiscardConfirmOpen(true);
              return;
            }
            reset();
          }
          onOpenChange(next);
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="flex max-h-[92vh] flex-col overflow-hidden rounded-t-3xl p-0"
        >
          <SheetCloseHeader
            title={step === "pick" ? "사진으로 추가" : "디토 AI 분석 결과"}
            description={
              step === "pick"
                ? "디토 AI는 여러 장의 사진도 예측 가능해요!"
                : "디토 AI가 이미지로 상품을 예측했어요!"
            }
            onClose={() => void handleClose()}
            className="shrink-0"
          />

          <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 pb-2 sm:px-6">
            <div className="flex flex-col gap-4">
              {step === "pick" ? (
                <>
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
                    <div className="grid grid-cols-4 gap-1.5">
                      {images.map((image) => (
                        <div
                          key={image.id}
                          className="relative aspect-square overflow-hidden rounded-lg"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.dataUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                          <button
                            type="button"
                            className="absolute top-0.5 right-0.5 rounded-full bg-black/50 p-0.5 text-white"
                            onClick={() =>
                              setImages((prev) =>
                                prev.filter((item) => item.id !== image.id),
                              )
                            }
                            aria-label="삭제"
                          >
                            <Trash2 className="size-3" />
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
                <div className="flex flex-col gap-2.5">
                  {proposed.map((item, index) => (
                    <div
                      key={item.sourceImageId}
                      className="flex min-w-0 gap-2.5 overflow-hidden rounded-2xl bg-muted/60 p-2.5"
                    >
                      <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-background">
                        {item.imageDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageDataUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <Textarea
                          placeholder="예측 상품명"
                          rows={1}
                          className="min-h-10 min-w-0 py-2"
                          value={item.name}
                          onChange={(e) =>
                            patchProposed(index, { name: e.target.value })
                          }
                        />
                        <Textarea
                          placeholder="예상 구매처"
                          rows={1}
                          className="min-h-10 min-w-0 py-2"
                          value={item.expectedStores.join(", ")}
                          onChange={(e) =>
                            patchProposed(index, {
                              expectedStores: parseStores(e.target.value),
                            })
                          }
                        />
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Input
                            type="number"
                            min={0}
                            inputMode="decimal"
                            placeholder="구매 예측 가격"
                            className="min-w-0 flex-1 text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            value={item.estimatedPrice}
                            onChange={(e) =>
                              patchProposed(index, {
                                estimatedPrice: Number(e.target.value) || 0,
                              })
                            }
                          />
                          <span className="shrink-0 text-[12px] font-medium text-muted-foreground">
                            {currencyMeta.code}
                          </span>
                          <Input
                            type="number"
                            min={1}
                            max={1000}
                            inputMode="numeric"
                            placeholder="1"
                            className="w-14 shrink-0 px-1.5 text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            value={item.quantity}
                            onChange={(e) => {
                              const raw = Number(e.target.value) || 1;
                              patchProposed(index, {
                                quantity: Math.min(1000, Math.max(1, raw)),
                              });
                            }}
                          />
                          <span className="shrink-0 text-[12px] font-medium text-muted-foreground">
                            개
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="shrink-0 border-t-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
            {step === "pick" ? (
              <Button
                disabled={!images.length || analyzing || startJob.isPending}
                onClick={handleAnalyzeClick}
              >
                {analyzing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                디토 AI 분석 시작
              </Button>
            ) : (
              <div className="flex w-full gap-2">
                {isJobReview ? null : (
                  <Button
                    variant="outline"
                    className="w-[88px] shrink-0"
                    onClick={() => setStep("pick")}
                  >
                    이전
                  </Button>
                )}
                <Button
                  className="min-w-0 flex-1"
                  disabled={createMany.isPending || !proposed.length}
                  onClick={() => void handleSave()}
                >
                  쇼핑리스트 등록
                </Button>
              </div>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={bgAlertOpen}
        onOpenChange={setBgAlertOpen}
        title="디토 AI분석을 시작합니다."
        description={"분석이 완료되면 디토가 알려드릴게요! ✨"}
        confirmLabel="확인"
        confirmVariant="default"
        hideCancel
        loading={startJob.isPending}
        onConfirm={() => void confirmBackgroundAnalyze()}
      />

      <ConfirmDialog
        open={discardConfirmOpen}
        onOpenChange={setDiscardConfirmOpen}
        title="쇼핑리스트 등록을 하지 않습니다"
        description="분석 결과를 등록하지 않고 닫을까요?"
        confirmLabel="확인"
        cancelLabel="취소"
        confirmVariant="default"
        loading={clearJob.isPending}
        onConfirm={() => void confirmDiscard()}
      />
    </>
  );
}
