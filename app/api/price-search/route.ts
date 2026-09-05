import { z } from "zod";
import { ApiError, handleApi, readJson, requireUser } from "@/lib/server/api";
import {
  isSerpApiConfigured,
  lookupPrice,
} from "@/features/image-analysis/server/serpapi";
import { marketFor } from "@/features/image-analysis/server/market";

const schema = z.object({
  query: z.string().trim().min(1).max(200),
  /** 국가 코드(JP·CN·TW·TH·KR). 없으면 일본 */
  country: z.string().trim().length(2).optional(),
});

/** 품목 하나의 가격을 단독으로 검색할 때 사용 */
export async function POST(request: Request) {
  return handleApi(async () => {
    await requireUser();
    if (!isSerpApiConfigured()) throw new ApiError(503, "SERPAPI_NOT_CONFIGURED");
    const { query, country } = schema.parse(await readJson(request));
    const result = await lookupPrice(query, marketFor(country));
    if (!result) throw new ApiError(404, "PRICE_NOT_FOUND");
    return result;
  });
}
