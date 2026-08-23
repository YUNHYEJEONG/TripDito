import { z } from "zod";
import { ApiError, handleApi, readJson, requireUser } from "@/lib/server/api";
import { isGeminiConfigured } from "@/features/image-analysis/server/gemini";
import { analyzeImages } from "@/features/image-analysis/server/analyze";

export const maxDuration = 60;

const MAX_IMAGES = 10;
/** 960px JPEG 0.72 기준 ~300KB. base64 여유분 포함 상한 */
const MAX_DATA_URL_LENGTH = 3 * 1024 * 1024;

const schema = z.object({
  images: z
    .array(
      z.object({
        id: z.string().min(1),
        dataUrl: z.string().regex(/^data:image\//).max(MAX_DATA_URL_LENGTH),
      }),
    )
    .min(1)
    .max(MAX_IMAGES),
  /** 기본 true. SerpAPI 키가 없으면 무시된다. */
  lookupPrices: z.boolean().optional(),
});

export async function POST(request: Request) {
  return handleApi(async () => {
    await requireUser();
    if (!isGeminiConfigured()) throw new ApiError(503, "GEMINI_NOT_CONFIGURED");
    const input = schema.parse(await readJson(request));
    return analyzeImages(input.images, { lookupPrices: input.lookupPrices });
  });
}
