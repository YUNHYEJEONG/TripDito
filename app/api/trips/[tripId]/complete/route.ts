import { handleApi, requireUser } from "@/lib/server/api";
import { completeTrip } from "@/lib/db/trips";

type Ctx = { params: Promise<{ tripId: string }> };

/** 여행 마치기 → 상태 DONE. 이어서 여권 도장 플로우로 이동한다 */
export async function POST(_request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    return completeTrip(user.userSn, (await params).tripId);
  });
}
