import { handleApi, readJson, requireUser } from "@/lib/server/api";
import { createTrip, listTrips, tripInputSchema } from "@/lib/db/trips";

/** 내 여행 목록 */
export async function GET() {
  return handleApi(async () => listTrips((await requireUser()).userSn));
}

/** 여행 생성 */
export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await requireUser();
    const input = tripInputSchema.parse(await readJson(request));
    return createTrip(user.userSn, input);
  }, 201);
}
