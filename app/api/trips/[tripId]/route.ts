import { handleApi, readJson, requireUser } from "@/lib/server/api";
import {
  deleteTrip,
  requireTrip,
  tripInputSchema,
  updateTrip,
} from "@/lib/db/trips";

type Ctx = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    return requireTrip(user.userSn, (await params).tripId);
  });
}

export async function PUT(request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    const input = tripInputSchema.parse(await readJson(request));
    return updateTrip(user.userSn, (await params).tripId, input);
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  return handleApi(async () => {
    const user = await requireUser();
    await deleteTrip(user.userSn, (await params).tripId);
    return { ok: true };
  });
}
