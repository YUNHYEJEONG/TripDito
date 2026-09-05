/**
 * CLI 스크립트용 R2 클라이언트. lib/r2/client.ts 는 `server-only` 라 tsx 에서 못 쓰므로
 * 필요한 최소 기능만 따로 둔다. 설정값은 .env.local 의 R2_* 를 그대로 사용한다.
 */
import {
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

let cached: S3Client | null = null;

export function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME,
  );
}

export function r2Bucket() {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME 이 없습니다");
  return bucket;
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
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return cached;
}

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  await getR2().send(
    new PutObjectCommand({ Bucket: r2Bucket(), Key: key, Body: body, ContentType: contentType }),
  );
}

export async function objectExists(key: string) {
  try {
    await getR2().send(new HeadObjectCommand({ Bucket: r2Bucket(), Key: key }));
    return true;
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    if (status === 404) return false;
    throw error;
  }
}

/** 브라우저 presigned PUT 에 필요한 버킷 CORS 규칙 */
export async function putBucketCors(allowedOrigins: string[]) {
  await getR2().send(
    new PutBucketCorsCommand({
      Bucket: r2Bucket(),
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: allowedOrigins,
            AllowedMethods: ["GET", "PUT", "HEAD"],
            AllowedHeaders: ["Content-Type", "Content-Length"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
}
