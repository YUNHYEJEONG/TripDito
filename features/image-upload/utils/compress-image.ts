import { appConfig } from "@/config/app";
import { createId } from "@/lib/storage/id";

export type CompressedImage = {
  id: string;
  dataUrl: string;
  fileName: string;
};

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러오지 못했어요"));
    };
    img.src = url;
  });
}

export async function compressImageFile(file: File): Promise<CompressedImage> {
  const img = await loadImage(file);
  const maxEdge = appConfig.imageMaxEdge;
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지 처리 기능을 사용할 수 없어요");
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", appConfig.imageQuality);
  return {
    id: createId(),
    dataUrl,
    fileName: file.name,
  };
}

export async function compressImageFiles(files: File[]) {
  const images: CompressedImage[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    images.push(await compressImageFile(file));
  }
  return images;
}
