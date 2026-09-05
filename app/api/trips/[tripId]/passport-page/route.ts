import { z } from "zod";
import { handleApi, readJson, requireUser } from "@/lib/server/api";
import { setTripPassportPage } from "@/lib/db/trips";

type Ctx = { params: Promise<{ tripId: string }> };

const schema = z.object({ pageNumber: z.number().int().min(1).max(100) });

/** 여권 도장을 찍은 페이지 저장 (기기 간 동기화) */
export async function PUT(request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    const { pageNumber } = schema.parse(await readJson(request));
    return setTripPassportPage(user.userSn, (await params).tripId, pageNumber);
  });
}
