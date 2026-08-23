import { api } from "./client";

export type UploadScope = "shots" | "items" | "avatars";

type PresignResponse = {
  attachmentId: string;
  files: Array<{
    seq: number;
    key: string;
    originalName: string;
    extension: string;
    size: number;
    uploadUrl: string;
  }>;
};

export type UploadedAttachment = {
  id: string;
  fileCount: number;
  files: Array<{ seq: number; path: string; url: string | null }>;
};

export function isDataUrl(src: string | null | undefined): src is string {
  return typeof src === "string" && src.startsWith("data:");
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** data: URL 또는 일반 URL → Blob */
async function toBlob(src: string): Promise<Blob> {
  const res = await fetch(src);
  if (!res.ok) throw new Error("이미지를 읽을 수 없습니다");
  return res.blob();
}

/**
 * 이미지(data URL / URL 배열)를 R2 에 올리고 첨부 묶음 ID 를 돌려준다.
 * 1) POST /api/uploads  → presigned URL
 * 2) PUT  <uploadUrl>   → R2 직접 업로드
 * 3) PUT  /api/uploads  → ATCM_FILE_* 등록
 */
export async function uploadImages(
  scope: UploadScope,
  sources: string[],
): Promise<UploadedAttachment> {
  if (sources.length === 0) throw new Error("업로드할 이미지가 없습니다");

  const blobs = await Promise.all(sources.map(toBlob));
  const meta = blobs.map((blob, i) => {
    const type = blob.type || "image/jpeg";
    const ext = EXT_BY_MIME[type] ?? "jpg";
    return { name: `image-${i + 1}.${ext}`, type, size: blob.size };
  });

  const presigned = await api<PresignResponse>("/api/uploads", {
    method: "POST",
    body: { scope, files: meta },
  });

  await Promise.all(
    presigned.files.map(async (f, i) => {
      const res = await fetch(f.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": meta[i].type },
        body: blobs[i],
      });
      if (!res.ok) throw new Error(`이미지 업로드 실패 (${res.status})`);
    }),
  );

  return api<UploadedAttachment>("/api/uploads", {
    method: "PUT",
    body: {
      attachmentId: presigned.attachmentId,
      files: presigned.files.map((f) => ({
        seq: f.seq,
        key: f.key,
        originalName: f.originalName,
        extension: f.extension,
        size: f.size,
      })),
    },
  });
}
