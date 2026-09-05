import { z } from "zod";
import { ApiError, handleApi, readJson, requireUser } from "@/lib/server/api";
import {
  ALLOWED_IMAGE_EXT,
  attachmentExists as sqlAttachmentExists,
  buildObjectKey,
  extensionOf,
  newAttachmentId,
  registerAttachment,
} from "@/lib/db/attachments";
import { headObject, isR2Configured, presignUpload } from "@/lib/r2/client";

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

/**
 * 2단계: R2 업로드 완료 후 ATCM_FILE_INFO / ATCM_FILE_DETL_INFO 등록.
 * 클라이언트가 보낸 키는 1단계에서 발급한 형식(scope/첨부ID/seq.ext)과 일치해야 하고,
 * 실제로 R2 에 올라가 있어야 한다. 남의 파일 경로를 자기 첨부로 등록하거나 빈 레코드가 남는 것을 막는다.
 */
export async function PUT(request: Request) {
  return handleApi(async () => {
    const user = await requireUser();
    if (!isR2Configured()) throw new ApiError(503, "R2_NOT_CONFIGURED");
    const input = registerSchema.parse(await readJson(request));
    const exists = (await sqlAttachmentExists(input.attachmentId));
    if (exists) throw new ApiError(409, "ATTACHMENT_ALREADY_REGISTERED");

    const extPattern = ALLOWED_IMAGE_EXT.join("|");
    await Promise.all(
      input.files.map(async (f) => {
        const expected = new RegExp(
          `^(shots|items|avatars)/${input.attachmentId}/${f.seq}\\.(${extPattern})$`,
        );
        if (!expected.test(f.key) || extensionOf(f.key) !== f.extension) {
          throw new ApiError(400, "INVALID_UPLOAD_KEY");
        }
        const head = await headObject(f.key);
        if (!head) throw new ApiError(400, "UPLOAD_NOT_FOUND");
        if (head.contentType && !head.contentType.startsWith("image/")) {
          throw new ApiError(400, "UNSUPPORTED_IMAGE_TYPE");
        }
        if (head.size > MAX_FILE_BYTES) throw new ApiError(400, "FILE_TOO_LARGE");
        f.size = head.size;
      }),
    );
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
