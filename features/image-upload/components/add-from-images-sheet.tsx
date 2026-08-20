"use client";

import { useRef, useState } from "react";
import {
  Camera,
  Images,
  Loader2,
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
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { CurrencyText } from "@/components/common/currency-text";
import {
  compressImageFiles,
  type CompressedImage,
} from "../utils/compress-image";
import type { ProposedItem } from "@/features/image-analysis/port";
import type { ImageAnalysisMode } from "@/features/image-analysis/resolve-analyzer";
import type { AnalysisJobIntent } from "@/features/image-analysis/types/analysis-job";
import {
  useAnalysisJob,
  useClearAnalysisJob,
  useStartAnalysisJob,
} from "@/features/image-analysis/hooks/use-analysis-job";
import { useCreateManyItems } from "@/features/shopping-items/hooks/use-items";
import {
  shoppingItemFormSchema,
  type ShoppingItemFormValues,
} from "@/features/shopping-items/schema";
import { useUnsavedChanges } from "@/lib/navigation/unsaved-changes";
import { tripRepository } from "@/features/trips/data/trip-repository";
import { analysisJobRepository } from "@/features/image-analysis/data/analysis-job-repository";
import { cn } from "@/lib/utils";

type Step = "pick" | "review";
type ImageImportFlow = "generic" | "prep" | "live" | "settlement";

export type ImageImportIntent = AnalysisJobIntent;

const DEFAULT_INTENT: ImageImportIntent = { kind: "shopping-list" };
const BACKGROUND_IMAGE_THRESHOLD = 3;
const MAX_SELECTED_IMAGES = 8;

function parseStores(value: string): string[] {
  return value
    .split(/[,，·/|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * 사진을 고르는 단계의 문구는 **네 흐름이 모두 같다.** 하는 일이 "사진 고르기"로 똑같은데
 * `살 것 후보 담기 / 오늘 산 것 기록 / 지난 여행 구매 기록`처럼 흐름마다 다른 이름을 붙이면
 * 같은 화면을 매번 다시 읽어야 하고, `후보`처럼 제품에서 쓰지 않는 말이 새어 나온다.
 * 흐름별로 진짜 달라지는 건 **가격의 의미와 저장 결과**뿐이라 그쪽만 나눈다.
 */
const PICK_COPY = {
  title: "사진으로 추가",
  description: "디토 AI는 여러 장의 사진도 예측 가능해요!",
  galleryLabel: "앨범",
  cameraLabel: "카메라",
  emptyLabel: "이미지를 선택하세요",
  draftLabel: "디토 AI 분석 시작",
} as const;

const FLOW_COPY: Record<
  ImageImportFlow,
  {
    pickTitle: string;
    reviewTitle: string;
    pickDescription: string;
    reviewDescription: string;
    galleryLabel: string;
    cameraLabel: string;
    emptyLabel: string;
    draftLabel: string;
    priceLabel: string;
    countLabel: string;
    totalLabel: string;
    saveLabel: (count: number) => string;
  }
> = {
  generic: {
    pickTitle: PICK_COPY.title,
    reviewTitle: "상품 확인",
    pickDescription: PICK_COPY.description,
    reviewDescription:
      "이름과 가격을 확인한 뒤 쇼핑리스트에 추가해 주세요.",
    galleryLabel: PICK_COPY.galleryLabel,
    cameraLabel: PICK_COPY.cameraLabel,
    emptyLabel: PICK_COPY.emptyLabel,
    draftLabel: PICK_COPY.draftLabel,
    priceLabel: "예상 가격",
    countLabel: "상품",
    totalLabel: "합계",
    saveLabel: (count) => `${count}개 추가`,
  },
  prep: {
    pickTitle: PICK_COPY.title,
    reviewTitle: "상품 확인",
    pickDescription: PICK_COPY.description,
    reviewDescription:
      "이름과 예상 가격을 확인하면 쇼핑리스트에 담아 둬요.",
    galleryLabel: PICK_COPY.galleryLabel,
    cameraLabel: PICK_COPY.cameraLabel,
    emptyLabel: PICK_COPY.emptyLabel,
    draftLabel: PICK_COPY.draftLabel,
    priceLabel: "예상 가격",
    countLabel: "상품",
    totalLabel: "예상 합계",
    saveLabel: (count) => `${count}개 추가`,
  },
  live: {
    pickTitle: PICK_COPY.title,
    reviewTitle: "구매 내역 확인",
    pickDescription: PICK_COPY.description,
    reviewDescription:
      "이름과 실제 결제 금액을 확인하면 오늘 구매 완료로 기록해요.",
    galleryLabel: PICK_COPY.galleryLabel,
    cameraLabel: PICK_COPY.cameraLabel,
    emptyLabel: PICK_COPY.emptyLabel,
    draftLabel: PICK_COPY.draftLabel,
    priceLabel: "결제 금액",
    countLabel: "구매",
    totalLabel: "결제 합계",
    saveLabel: (count) => `${count}개 구매 기록`,
  },
  settlement: {
    pickTitle: PICK_COPY.title,
    reviewTitle: "구매 내역 확인",
    pickDescription: PICK_COPY.description,
    reviewDescription:
      "이름과 가격을 확인하면 지난 여행의 구매 완료 기록으로 저장해요.",
    galleryLabel: PICK_COPY.galleryLabel,
    cameraLabel: PICK_COPY.cameraLabel,
    emptyLabel: PICK_COPY.emptyLabel,
    draftLabel: PICK_COPY.draftLabel,
    priceLabel: "기록 가격",
    countLabel: "구매 기록",
    totalLabel: "기록 합계",
    saveLabel: (count) => `${count}개 기록 저장`,
  },
};

export function AddFromImagesSheet({
  tripId,
  currency,
  open,
  onOpenChange,
  intent = DEFAULT_INTENT,
  reviewProposed,
  fromBackgroundJob = false,
  analysisMode,
}: {
  tripId: string;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent?: ImageImportIntent;
  /** 백그라운드 분석이 끝난 뒤 같은 검토 UI에서 여는 결과 */
  reviewProposed?: ProposedItem[] | null;
  fromBackgroundJob?: boolean;
  analysisMode?: ImageAnalysisMode;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const startsWithReview = Boolean(reviewProposed?.length);
  const [step, setStep] = useState<Step>(
    startsWithReview ? "review" : "pick",
  );
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [proposed, setProposed] = useState<ProposedItem[]>(
    reviewProposed ?? [],
  );
  const [processingFiles, setProcessingFiles] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [backgroundConfirmOpen, setBackgroundConfirmOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [resultMode, setResultMode] = useState<ImageAnalysisMode | null>(
    analysisMode ?? null,
  );
  const [validationErrors, setValidationErrors] = useState<
    Record<number, string>
  >({});
  const flow: ImageImportFlow =
    intent.kind === "pretrip-candidates"
      ? "prep"
      : intent.kind === "trip-purchases"
        ? intent.context === "settlement"
          ? "settlement"
          : "live"
        : "generic";
  const plannedPurchaseDate =
    intent.kind === "trip-purchases"
      ? intent.purchasedOn
      : intent.kind === "shopping-list"
        ? (intent.plannedPurchaseDate ?? null)
        : null;
  const markPurchased = intent.kind === "trip-purchases";
  const copy = FLOW_COPY[flow];
  const createMany = useCreateManyItems(tripId, {
    markPurchased,
    purchasedAt:
      intent.kind === "trip-purchases"
        ? `${intent.purchasedOn}T12:00:00.000Z`
        : undefined,
  });
  const { data: analysisJob } = useAnalysisJob();
  const startAnalysisJob = useStartAnalysisJob();
  const clearAnalysisJob = useClearAnalysisJob();

  function reset() {
    requestIdRef.current += 1;
    setStep("pick");
    setImages([]);
    setProposed([]);
    setProcessingFiles(false);
    setAnalyzing(false);
    setBackgroundConfirmOpen(false);
    setResultMode(null);
    setValidationErrors({});
  }

  const hasDraft =
    processingFiles || analyzing || images.length > 0 || proposed.length > 0;
  useUnsavedChanges(open && hasDraft);

  function requestClose() {
    if (hasDraft) {
      setDiscardOpen(true);
      return;
    }
    reset();
    onOpenChange(false);
  }

  async function discardAndClose() {
    if (fromBackgroundJob) {
      await clearAnalysisJob.mutateAsync();
    }
    reset();
    setDiscardOpen(false);
    onOpenChange(false);
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const remaining = MAX_SELECTED_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`사진은 한 번에 ${MAX_SELECTED_IMAGES}장까지 선택할 수 있어요.`);
      return;
    }
    const files = Array.from(fileList).slice(0, remaining);
    if (fileList.length > remaining) {
      toast.warning(
        `저장 공간을 위해 사진 ${MAX_SELECTED_IMAGES}장까지만 선택했어요.`,
      );
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setProcessingFiles(true);
    try {
      const compressed = await compressImageFiles(files);
      if (requestIdRef.current !== requestId) return;
      if (!compressed.length) {
        toast.error("이미지 파일을 선택해 주세요.");
        return;
      }
      setImages((prev) => [...prev, ...compressed]);
    } catch {
      if (requestIdRef.current === requestId) {
        toast.error("이미지를 처리하지 못했어요. 다시 선택해 주세요.");
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setProcessingFiles(false);
      }
    }
  }

  async function handleAnalyze() {
    if (!images.length || processingFiles) return;
    if (images.length >= BACKGROUND_IMAGE_THRESHOLD) {
      if (
        analysisJob?.status === "running" ||
        analysisJob?.status === "done"
      ) {
        toast.error("진행 중인 사진 분석 결과를 먼저 확인해 주세요.");
        return;
      }
      setBackgroundConfirmOpen(true);
      return;
    }
    const requestId = requestIdRef.current;
    setAnalyzing(true);
    try {
      const context = tripRepository.getById(tripId);
      if (!context) throw new Error("TRIP_NOT_FOUND");
      const response = await fetch("/api/image-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images,
          context: {
            city: context.city,
            country: context.country,
            currency,
          },
        }),
      });
      const body = (await response.json()) as {
        items?: ProposedItem[];
        mode?: ImageAnalysisMode;
        message?: string;
      };
      if (!response.ok || !body.items || !body.mode) {
        throw new Error(body.message ?? "ANALYSIS_FAILED");
      }
      if (requestIdRef.current !== requestId) return;
      setProposed(body.items);
      setResultMode(body.mode);
      setValidationErrors({});
      setStep("review");
    } catch {
      if (requestIdRef.current === requestId) {
        toast.error("사진 분석을 마치지 못했어요. 다시 시도해 주세요.");
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setAnalyzing(false);
      }
    }
  }

  async function confirmBackgroundAnalyze() {
    const context = tripRepository.getById(tripId);
    if (!context) {
      toast.error("여행을 찾지 못했어요.");
      return;
    }
    try {
      await startAnalysisJob.mutateAsync({
        tripId,
        images,
        context: {
          city: context.city,
          country: context.country,
          currency,
        },
        intent,
      });
      reset();
      onOpenChange(false);
      toast.success("사진 분석을 시작했어요. 다른 화면을 둘러봐도 괜찮아요.");
    } catch {
      toast.error("백그라운드 분석을 시작하지 못했어요. 저장 공간을 확인해 주세요.");
    }
  }

  async function handleSave() {
    const inputs: ShoppingItemFormValues[] = [];
    const nextErrors: Record<number, string> = {};

    proposed.forEach((item, index) => {
      const result = shoppingItemFormSchema.safeParse({
        name: item.name,
        estimatedPrice: item.estimatedPrice,
        quantity: item.quantity,
        memo: item.memo,
        imageDataUrl: item.imageDataUrl,
        plannedPurchaseDate,
        plannedPurchaseDates: plannedPurchaseDate
          ? [plannedPurchaseDate]
          : [],
        giftTags: [],
        localName: item.localName || null,
        expectedStores: item.expectedStores,
        similarMatchCount: item.similarMatchCount,
        favorited: false,
      });
      if (result.success) inputs.push(result.data);
      else {
        nextErrors[index] = "상품명과 가격, 수량을 확인해 주세요.";
      }
    });

    setValidationErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!tripRepository.getById(tripId)) {
      toast.error("여행을 찾지 못했어요. 여행 목록에서 다시 시작해 주세요.");
      return;
    }

    const releasedJob =
      fromBackgroundJob && analysisJob?.id
        ? analysisJobRepository.releaseCompleted(analysisJob.id)
        : null;
    if (fromBackgroundJob && !releasedJob) {
      toast.error("분석 결과가 바뀌었어요. 최신 결과를 다시 열어 주세요.");
      return;
    }

    try {
      // 백그라운드 job은 원본 data URL까지 localStorage에 들고 있습니다.
      // 상품에 같은 이미지를 쓰기 전에 지워야 저장 순간 용량이 두 배가 되지 않습니다.
      await createMany.mutateAsync(inputs);
      if (fromBackgroundJob) await clearAnalysisJob.mutateAsync();
      reset();
      onOpenChange(false);
    } catch {
      if (releasedJob) analysisJobRepository.restoreReleased(releasedJob);
      toast.error(
        fromBackgroundJob
          ? "상품을 저장하지 못했어요. 검토 내용은 열어 둔 채 다시 시도할 수 있어요."
          : "상품을 저장하지 못했어요. 다시 시도해 주세요.",
      );
    }
  }

  const totalQuantity = proposed.reduce(
    (sum, item) => sum + Math.max(1, item.quantity),
    0,
  );
  const reviewDisclosure =
    resultMode === "draft"
      ? "이미지 내용을 인식한 결과가 아닌 파일명 초안이에요. 상품명과 가격을 직접 확인해 주세요."
      : resultMode === "catalog-demo"
        ? "실제 이미지 인식이 아닌 데모 카탈로그 추정이에요. 모든 정보를 직접 확인해 주세요."
        : resultMode === "mixed"
          ? "사진마다 사용 가능한 분석 방식이 달랐어요. 상품별 이름과 가격을 확인해 주세요."
          : resultMode === "lens"
            ? "이미지 검색 후보를 바탕으로 만든 결과예요. 상품과 가격이 맞는지 확인해 주세요."
            : "사진 분석 결과는 틀릴 수 있어요. 저장 전에 이름과 가격을 확인해 주세요.";

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (next) {
            onOpenChange(true);
            return;
          }
          requestClose();
        }}
      >
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[92dvh] w-full max-w-[480px] overflow-hidden rounded-t-2xl p-0"
        >
          <SheetHeader className="shrink-0 border-b border-rule px-4 py-4 pr-16">
            <SheetTitle>
              {step === "pick"
                ? copy.pickTitle
                : resultMode === "draft"
                  ? "파일명 상품 초안 확인"
                  : copy.reviewTitle}
            </SheetTitle>
            <SheetDescription>
              {step === "pick"
                ? copy.pickDescription
                : copy.reviewDescription}
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            <div className="flex flex-col gap-4">
          {step === "pick" ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                {(flow === "live"
                  ? (["camera", "gallery"] as const)
                  : (["gallery", "camera"] as const)
                ).map((source) => (
                  <Button
                    key={source}
                    type="button"
                    variant="outline"
                    className="h-12 min-w-0 px-2"
                    disabled={processingFiles || analyzing}
                    onClick={() =>
                      source === "camera"
                        ? cameraRef.current?.click()
                        : galleryRef.current?.click()
                    }
                  >
                    {source === "camera" ? <Camera /> : <Images />}
                    {source === "camera"
                      ? copy.cameraLabel
                      : copy.galleryLabel}
                  </Button>
                ))}
              </div>
              <p className="text-[12px] leading-5 text-ink-2">
                분석을 시작하면 선택한 사진이 설정된 외부 이미지 분석 서비스로
                전송될 수 있어요. 한 번에 최대 {MAX_SELECTED_IMAGES}장까지
                선택할 수 있어요.
              </p>
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                multiple
                disabled={processingFiles || analyzing}
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
                disabled={processingFiles || analyzing}
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
                        className="absolute top-1 right-1 flex size-11 items-center justify-center rounded-full bg-ink/80 text-paper outline-none transition-colors duration-120 hover:bg-ink active:bg-ink-2 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                        onClick={() =>
                          setImages((prev) =>
                            prev.filter((item) => item.id !== image.id),
                          )
                        }
                        aria-label="선택한 사진 삭제"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {copy.emptyLabel}
                </p>
              )}
            </>
          ) : proposed.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p
                className={cn(
                  "rounded-xl border border-rule bg-paper-2 px-3 py-2.5 text-[12px] leading-5 text-ink-2",
                  (resultMode === "draft" ||
                    resultMode === "catalog-demo" ||
                    resultMode === "mixed") && "border-warning/35 bg-warning/10 text-ink",
                )}
                role="status"
              >
                {reviewDisclosure}
              </p>
              {proposed.map((item, index) => (
                <div
                  key={item.sourceImageId}
                  className="rounded-2xl border border-rule bg-paper p-3"
                >
                  <div className="flex items-center gap-3">
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
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-ink-2">
                        상품 {index + 1}
                      </p>
                      <p className="mt-1 truncate text-[14px] font-semibold text-ink">
                        {item.name || "상품명 미입력"}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`${item.name || `상품 ${index + 1}`} 초안 삭제`}
                      className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-2 outline-none transition-colors duration-120 hover:bg-paper-2 hover:text-ink active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
                      onClick={() => {
                        setProposed((prev) =>
                          prev.filter((_, itemIndex) => itemIndex !== index),
                        );
                        setValidationErrors({});
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>

                  <div className="mt-4 flex min-w-0 flex-col gap-4">
                    <label className="space-y-2 text-[12px] font-semibold text-ink-2">
                      상품명
                      <Input
                        value={item.name}
                        aria-invalid={Boolean(validationErrors[index])}
                        aria-describedby={`image-item-error-${index}`}
                        onChange={(e) => {
                          const name = e.target.value;
                          setProposed((prev) =>
                            prev.map((row, i) =>
                              i === index ? { ...row, name } : row,
                            ),
                          );
                        }}
                      />
                    </label>
                    {resultMode !== "draft" ? (
                      <div className="grid gap-4 min-[380px]:grid-cols-2 min-[380px]:gap-3">
                        <label className="space-y-2 text-[12px] font-semibold text-ink-2">
                          현지 상품명
                          <Input
                            value={item.localName}
                            placeholder="모르면 비워 두세요"
                            onChange={(e) => {
                              const localName = e.target.value;
                              setProposed((prev) =>
                                prev.map((row, i) =>
                                  i === index ? { ...row, localName } : row,
                                ),
                              );
                            }}
                          />
                        </label>
                        <label className="space-y-2 text-[12px] font-semibold text-ink-2">
                          예상 구매처
                          <Input
                            key={`${item.sourceImageId}-stores`}
                            defaultValue={item.expectedStores.join(", ")}
                            placeholder="쉼표로 구분"
                            onBlur={(e) => {
                              const expectedStores = parseStores(e.target.value);
                              setProposed((prev) =>
                                prev.map((row, i) =>
                                  i === index
                                    ? { ...row, expectedStores }
                                    : row,
                                ),
                              );
                            }}
                          />
                        </label>
                      </div>
                    ) : null}
                    <div className="grid gap-4 min-[380px]:grid-cols-[minmax(0,1fr)_8.75rem] min-[380px]:gap-3">
                      <label className="space-y-2 text-[12px] font-semibold text-ink-2">
                        {copy.priceLabel}
                        <Input
                          type="number"
                          min={0}
                          inputMode="decimal"
                          value={item.estimatedPrice}
                          aria-invalid={Boolean(validationErrors[index])}
                          aria-describedby={`image-item-error-${index}`}
                          onChange={(e) => {
                            const estimatedPrice = Number(e.target.value) || 0;
                            setProposed((prev) =>
                              prev.map((row, i) =>
                                i === index ? { ...row, estimatedPrice } : row,
                              ),
                            );
                          }}
                        />
                      </label>
                      <div className="space-y-2">
                        <span className="block text-[12px] font-semibold text-ink-2">수량</span>
                        <div
                          className="grid h-11 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center overflow-hidden rounded-lg border border-control bg-paper"
                          role="group"
                          aria-label={`${item.name} 수량`}
                        >
                          <button
                            type="button"
                            aria-label="수량 줄이기"
                            disabled={item.quantity <= 1}
                            className="flex size-11 items-center justify-center text-ink outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus disabled:cursor-not-allowed disabled:bg-paper disabled:text-ink-3"
                            onClick={() =>
                              setProposed((prev) =>
                                prev.map((row, i) =>
                                  i === index
                                    ? {
                                        ...row,
                                        quantity: Math.max(
                                          1,
                                          row.quantity - 1,
                                        ),
                                      }
                                    : row,
                                ),
                              )
                            }
                          >
                            <Minus className="size-4" aria-hidden />
                          </button>
                          <output className="text-center text-[15px] font-semibold text-ink">
                            {item.quantity}
                          </output>
                          <button
                            type="button"
                            aria-label="수량 늘리기"
                            className="flex size-11 items-center justify-center text-ink outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
                            onClick={() =>
                              setProposed((prev) =>
                                prev.map((row, i) =>
                                  i === index
                                    ? { ...row, quantity: row.quantity + 1 }
                                    : row,
                                ),
                              )
                            }
                          >
                            <Plus className="size-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </div>
                    <p
                      id={`image-item-error-${index}`}
                      className="text-[12px] leading-5 text-ink"
                      aria-live="polite"
                    >
                      {validationErrors[index] ?? null}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-[14px] font-medium text-ink">
                남아 있는 상품 초안이 없어요
              </p>
              <p className="mt-1 text-[13px] text-ink-2">
                사진 선택으로 돌아가 다시 만들어 주세요.
              </p>
            </div>
          )}
            </div>
        </div>

        <SheetFooter className="shrink-0 border-t border-rule p-4">
          {step === "pick" ? (
            <Button
              disabled={!images.length || analyzing || processingFiles}
              onClick={() => void handleAnalyze()}
            >
              {analyzing || processingFiles ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles />
              )}
              {processingFiles
                ? "사진 처리 중"
                  : analyzing
                  ? "상품 분석 중"
                  : copy.draftLabel}
            </Button>
          ) : (
            <div className="w-full">
              <div className="mb-3 flex items-center justify-between gap-3 text-[12px] text-ink-2">
                <span>{copy.countLabel} {totalQuantity}개</span>
                <span className="min-w-0 text-right font-semibold text-ink [overflow-wrap:anywhere]">
                  {copy.totalLabel} {" "}
                  <CurrencyText
                    amount={proposed.reduce(
                      (sum, item) =>
                        sum + item.estimatedPrice * Math.max(1, item.quantity),
                      0,
                    )}
                    currency={currency}
                  />
                </span>
              </div>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
                <Button
                  variant="outline"
                  className="px-3"
                  onClick={() => setStep("pick")}
                >
                  다시 선택
                </Button>
                <Button
                  disabled={createMany.isPending || !proposed.length}
                  onClick={() => void handleSave()}
                >
                  {copy.saveLabel(totalQuantity)}
                </Button>
              </div>
            </div>
          )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={backgroundConfirmOpen}
        onOpenChange={setBackgroundConfirmOpen}
        title={`사진 ${images.length}장을 백그라운드에서 분석할까요?`}
        description="시트를 닫고 다른 화면을 둘러봐도 분석은 계속돼요. 완료되면 상단 배너와 알림으로 알려 드려요."
        confirmLabel="분석 시작"
        cancelLabel="계속 편집"
        confirmVariant="default"
        loading={startAnalysisJob.isPending}
        onConfirm={() => void confirmBackgroundAnalyze()}
      />
      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="사진 작업을 닫을까요?"
        description="선택한 사진과 수정한 상품 초안이 사라져요."
        confirmLabel="작업 버리기"
        cancelLabel="계속 편집"
        loading={clearAnalysisJob.isPending}
        onConfirm={() => void discardAndClose()}
      />
    </>
  );
}
