import { z } from "zod";
import { ApiError, handleApi, readJson, requireUser } from "@/lib/server/api";
import { isGeminiConfigured } from "@/features/image-analysis/server/gemini";
import { analyzeImages } from "@/features/image-analysis/server/analyze";
import { marketFor } from "@/features/image-analysis/server/market";
import { requireTrip } from "@/lib/db/trips";

export const maxDuration = 60;

/**
 * Vercel 서버리스 요청 본문 상한은 4.5MB 다. 분석 프리셋(1600px, JPEG 0.85) 사진은
 * base64 로 최대 ~1.5MB 이므로 한 요청에 2장까지만 받는다. 클라이언트는 1장씩 나눠 보낸다.
 */
const MAX_IMAGES = 2;
const MAX_DATA_URL_LENGTH = 2 * 1024 * 1024;

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
  /** 여행지 국가·통화로 프롬프트와 가격 검색 지역을 맞춘다. 없으면 일본 기준 */
  tripId: z.string().regex(/^\d+$/).optional(),
  /** 기본 true. SerpAPI 키가 없으면 무시된다. */
  lookupPrices: z.boolean().optional(),
});

export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await requireUser();
    if (!isGeminiConfigured()) throw new ApiError(503, "GEMINI_NOT_CONFIGURED");
    const input = schema.parse(await readJson(request));
    const trip = input.tripId ? await requireTrip(user.userSn, input.tripId) : null;
    const market = marketFor(trip?.countryCode, trip?.currency);
    return analyzeImages(input.images, { lookupPrices: input.lookupPrices, market });
  });
}
