import { z } from "zod";
import { ApiError, handleApi, readJson, requireUser } from "@/lib/server/api";
import { isGeminiConfigured } from "@/features/image-analysis/server/gemini";
import { searchStores } from "@/features/image-analysis/server/store-search";
import { marketFor } from "@/features/image-analysis/server/market";
import { requireTrip } from "@/lib/db/trips";

export const maxDuration = 45;

const schema = z.object({
  productName: z.string().trim().min(1).max(200),
});

type Ctx = { params: Promise<{ tripId: string }> };

/**
 * 여행 도시 인근에서 상품을 살 수 있는 매장 추천.
 * 여행의 국가·도시를 서버에서 읽어 검색하므로 클라이언트는 상품명만 보낸다.
 */
export async function POST(request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    if (!isGeminiConfigured()) throw new ApiError(503, "GEMINI_NOT_CONFIGURED");
    const input = schema.parse(await readJson(request));
    const trip = await requireTrip(user.userSn, (await params).tripId);
    const market = marketFor(trip.countryCode, trip.currency);
    const result = await searchStores(input.productName, trip.city, market);
    return { ...result, city: trip.city, country: trip.country };
  });
}
