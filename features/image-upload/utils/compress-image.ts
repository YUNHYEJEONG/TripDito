import { appConfig } from "@/config/app";
import { createId } from "@/lib/storage/id";

export type CompressedImage = {
  id: string;
  dataUrl: string;
  fileName: string;
};

export type CompressOptions = {
  /** 긴 변 최대 px */
  maxEdge?: number;
  /** JPEG 품질 0~1 */
  quality?: number;
};

/** 용도별 프리셋. 숫자는 config/app.ts 의 imagePresets 에서 관리 */
export const IMAGE_PRESETS = appConfig.imagePresets;

/**
 * 파일 → 비트맵. createImageBitmap 은 EXIF 회전을 반영하고 고품질 리샘플링을 쓴다.
 * 지원하지 않는 브라우저는 <img> 로 폴백.
 */
async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, {
        imageOrientation: "from-image",
        resizeQuality: "high",
      });
    } catch {
      // 폴백
    }
  }
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러오지 못했습니다"));
    };
    img.src = url;
  });
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas를 사용할 수 없습니다");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { canvas, ctx };
}

/**
 * 한 번에 크게 줄이면 계단 현상이 생기므로, 목표 크기의 2배가 될 때까지
 * 절반씩 단계적으로 줄인 뒤 마지막에 정확한 크기로 맞춘다.
 */
function downscale(
  source: ImageBitmap | HTMLImageElement,
  targetW: number,
  targetH: number,
) {
  let curW = source.width;
  let curH = source.height;
  let current: CanvasImageSource = source;

  while (curW / 2 >= targetW && curH / 2 >= targetH) {
    curW = Math.round(curW / 2);
    curH = Math.round(curH / 2);
    const step = makeCanvas(curW, curH);
    step.ctx.drawImage(current, 0, 0, curW, curH);
    current = step.canvas;
  }

  const { canvas, ctx } = makeCanvas(targetW, targetH);
  ctx.drawImage(current, 0, 0, targetW, targetH);
  return canvas;
}

export async function compressImageFile(
  file: File,
  options: CompressOptions = {},
): Promise<CompressedImage> {
  const maxEdge = options.maxEdge ?? IMAGE_PRESETS.shot.maxEdge;
  const quality = options.quality ?? IMAGE_PRESETS.shot.quality;

  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = downscale(bitmap, width, height);
  if ("close" in bitmap) bitmap.close();

  return {
    id: createId(),
    dataUrl: canvas.toDataURL("image/jpeg", quality),
    fileName: file.name,
  };
}

export async function compressImageFiles(
  files: File[],
  options: CompressOptions = {},
) {
  const images: CompressedImage[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    images.push(await compressImageFile(file, options));
  }
  return images;
}

/**
 * 이미 data URL 인 이미지를 다른 프리셋으로 다시 압축한다.
 * (예: 분석용 1600px 사진을 품목 썸네일용 1024px 로 줄여 저장)
 */
export async function recompressDataUrl(
  dataUrl: string,
  options: CompressOptions = {},
): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], "image.jpg", { type: blob.type || "image/jpeg" });
  return (await compressImageFile(file, options)).dataUrl;
}
