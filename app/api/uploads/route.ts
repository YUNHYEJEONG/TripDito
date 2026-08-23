import { z } from "zod";
import { ApiError, handleApi, readJson, requireUser } from "@/lib/server/api";
import {
  ALLOWED_IMAGE_EXT,
  buildObjectKey,
  extensionOf,
  newAttachmentId,
  registerAttachment,
} from "@/lib/db/attachments";
import { isR2Configured, presignUpload } from "@/lib/r2/client";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const presignSchema = z.object({
  scope: z.enum(["shots", "items", "avatars"]),
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        type: z.string().regex(/^image\//),
        size: z.number().int().min(1).max(MAX_FILE_BYTES),
      }),
    )
    .min(1)
    .max(10),
});

/**
 * 1단계: R2 업로드용 presigned URL 발급.
 * 브라우저가 응답의 uploadUrl 로 직접 PUT 한 뒤, 2단계(PUT /api/uploads)로 DB에 등록한다.
 */
export async function POST(request: Request) {
  return handleApi(async () => {
    await requireUser();
    if (!isR2Configured()) throw new ApiError(503, "R2_NOT_CONFIGURED");
    const input = presignSchema.parse(await readJson(request));
    const attachmentId = newAttachmentId();
    const files = await Promise.all(
      input.files.map(async (f, i) => {
        const ext = extensionOf(f.name);
        if (!(ALLOWED_IMAGE_EXT as readonly string[]).includes(ext)) {
          throw new ApiError(400, "UNSUPPORTED_IMAGE_TYPE");
        }
        const seq = i + 1;
        const key = buildObjectKey(input.scope, attachmentId, seq, ext);
        return {
          seq,
          key,
          originalName: f.name,
          extension: ext,
          size: f.size,
          uploadUrl: await presignUpload(key, f.type),
        };
      }),
    );
    return { attachmentId, files };
  }, 201);
}

const registerSchema = z.object({
  attachmentId: z.string().min(1).max(30),
  files: z
    .array(
      z.object({
        seq: z.number().int().min(1),
        key: z.string().min(1).max(500),
        originalName: z.string().min(1).max(255),
        extension: z.string().min(1).max(20),
        size: z.number().int().min(1),
      }),
    )
    .min(1)
    .max(10),
});

/** 2단계: R2 업로드 완료 후 ATCM_FILE_INFO / ATCM_FILE_DETL_INFO 등록 */
export async function PUT(request: Request) {
  return handleApi(async () => {
    const user = await requireUser();
    const input = registerSchema.parse(await readJson(request));
    return registerAttachment({
      id: input.attachmentId,
      ownerSn: user.userSn,
      files: input.files.map((f) => ({
        seq: f.seq,
        originalName: f.originalName,
        extension: f.extension,
        size: f.size,
        path: f.key,
      })),
    });
  });
}
