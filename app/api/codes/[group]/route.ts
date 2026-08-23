import { NextResponse } from "next/server";
import { listCodes, type CodeGroup } from "@/lib/db/codes";

const GROUPS: CodeGroup[] = [
  "NTN",
  "CRNCY",
  "TRIP_STTUS",
  "GIFT_TAG",
  "CHNL",
  "SHOT_STTUS",
  "PRVDR",
  "LINK_TY",
  "USER_STTUS",
  "APLY_BASE",
  "CPN_SRC",
];

/** 공통코드 조회 (공개). 예: /api/codes/NTN */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ group: string }> },
) {
  const group = (await params).group.toUpperCase() as CodeGroup;
  if (!GROUPS.includes(group)) {
    return NextResponse.json({ error: "UNKNOWN_GROUP" }, { status: 404 });
  }
  return NextResponse.json(await listCodes(group));
}
