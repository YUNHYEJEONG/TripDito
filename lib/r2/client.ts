import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 (S3 호환). 첨부파일 바이너리는 여기에, DB에는 오브젝트 키만 저장한다.
 * 대시보드: https://dash.cloudflare.com/<R2_ACCOUNT_ID>/r2/overview
 */
let cached: S3Client | null = null;

export function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME,
  );
}

export function getR2() {
  if (cached) return cached;
  if (!isR2Configured()) {
    throw new Error(
      "R2 환경변수(R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME)가 없습니다",
    );
  }
  cached = new S3Client({
    region: "auto",
    endpoint:
      process.env.R2_ENDPOINT ??
      `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    // AWS SDK v3.729+ 기본 체크섬(CRC32)이 presigned URL에
    // x-amz-checksum-crc32(빈 본문 값)를 박아 넣어 R2 브라우저 PUT이 실패한다.
    // R2 권장 설정: 필요할 때만 체크섬 계산.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return cached;
}

export function r2Bucket() {
  return process.env.R2_BUCKET_NAME!;
}

/** 브라우저가 직접 PUT 할 수 있는 presigned URL (기본 10분) */
export async function presignUpload(
  key: string,
  contentType: string,
  expiresIn = 600,
) {
  return getSignedUrl(
    getR2(),
    new PutObjectCommand({ Bucket: r2Bucket(), Key: key, ContentType: contentType }),
    { expiresIn },
  );
}

/** 서버에서 직접 업로드 (base64 마이그레이션 등) */
export async function putObject(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string,
) {
  await getR2().send(
    new PutObjectCommand({
      Bucket: r2Bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/** 오브젝트 존재 여부와 크기. 없으면 null (presigned 업로드가 실제로 끝났는지 확인용) */
export async function headObject(key: string) {
  try {
    const res = await getR2().send(
      new HeadObjectCommand({ Bucket: r2Bucket(), Key: key }),
    );
    return { size: res.ContentLength ?? 0, contentType: res.ContentType ?? null };
  } catch (error) {
    const name = (error as { name?: string })?.name;
    const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    if (name === "NotFound" || name === "NoSuchKey" || status === 404) return null;
    throw error;
  }
}

export async function deleteObject(key: string) {
  await getR2().send(
    new DeleteObjectCommand({ Bucket: r2Bucket(), Key: key }),
  );
}

/**
 * 오브젝트 키 → 이미지 URL.
 * R2_PUBLIC_BASE_URL 이 있으면 공개 버킷 URL, 없으면 서버 프록시(/api/files/…)로 서빙한다.
 */
export function publicUrl(key: string): string | null {
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (base) return `${base}/${key}`;
  return `/api/files/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function getObject(key: string) {
  return getR2().send(new GetObjectCommand({ Bucket: r2Bucket(), Key: key }));
}
