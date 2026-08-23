import { handleApi, requireUser } from "@/lib/server/api";
import { listShotItems } from "@/lib/db/shots";

/** 때샷에 연결된 쇼핑품목 + 여행 요약 (다른 사람 리스트 퍼가기용) */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shotId: string }> },
) {
  return handleApi(async () => {
    const user = await requireUser();
    return listShotItems(user.userSn, (await params).shotId);
  });
}
