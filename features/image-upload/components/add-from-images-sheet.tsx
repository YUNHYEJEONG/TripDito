"use client";

import { useRef, useState } from "react";
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
  type CompressedImage,
} from "../utils/compress-image";
import { apiImageAnalyzer } from "@/features/image-analysis/api-analyzer";
import type { ProposedItem } from "@/features/image-analysis/port";
import { useCreateManyItems } from "@/features/shopping-items/hooks/use-items";

type Step = "pick" | "review";

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
  const [step, setStep] = useState<Step>("pick");
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [proposed, setProposed] = useState<ProposedItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const createMany = useCreateManyItems(tripId);

  function reset() {
    setStep("pick");
    setImages([]);
    setProposed([]);
    setAnalyzing(false);
  }

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

  async function handleAnalyze() {
    if (!images.length) return;
    setAnalyzing(true);
    try {
      const result = await apiImageAnalyzer.analyze(images);
      if (!result.length) {
        toast.error("사진에서 상품을 찾지 못했습니다");
        return;
      }
      setProposed(result);
      setStep("review");
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      toast.error(
        code === "UNAUTHORIZED"
          ? "로그인이 필요합니다"
          : code === "GEMINI_NOT_CONFIGURED"
            ? "분석 서비스가 설정되지 않았습니다"
            : "분석에 실패했습니다",
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
          plannedPurchaseDate: null,
          giftTags: [],
        })),
      );
      toast.success(`${proposed.length}개 상품을 추가했습니다`);
      reset();
      onOpenChange(false);
    } catch {
      toast.error("저장에 실패했습니다");
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
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
              ? "사진에서 상품과 가격을 자동으로 찾아냅니다."
              : "상품 정보를 수정한 뒤 리스트에 추가하세요."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-6 pb-2">
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
                      onChange={(e) => {
                        const name = e.target.value;
                        setProposed((prev) =>
                          prev.map((row, i) =>
                            i === index ? { ...row, name } : row,
                          ),
                        );
                      }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={item.estimatedPrice}
                        onChange={(e) => {
                          const estimatedPrice = Number(e.target.value) || 0;
                          setProposed((prev) =>
                            prev.map((row, i) =>
                              i === index ? { ...row, estimatedPrice } : row,
                            ),
                          );
                        }}
                      />
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const quantity = Math.max(1, Number(e.target.value) || 1);
                          setProposed((prev) =>
                            prev.map((row, i) =>
                              i === index ? { ...row, quantity } : row,
                            ),
                          );
                        }}
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
              disabled={!images.length || analyzing}
              onClick={() => void handleAnalyze()}
            >
              {analyzing ? <Loader2 className="animate-spin" /> : <Sparkles />}
              사진 분석
            </Button>
          ) : (
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="sm:flex-1"
                onClick={() => setStep("pick")}
              >
                다시 선택
              </Button>
              <Button
                className="sm:flex-1"
                disabled={createMany.isPending || !proposed.length}
                onClick={() => void handleSave()}
              >
                리스트에 추가
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
