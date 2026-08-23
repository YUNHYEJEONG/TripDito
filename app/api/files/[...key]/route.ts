import { NextResponse } from "next/server";
import { getObject, isR2Configured } from "@/lib/r2/client";

/**
 * R2 오브젝트 프록시. 버킷을 공개하지 않아도 이미지를 서빙할 수 있다.
 * R2_PUBLIC_BASE_URL 을 설정하면 이 경로 대신 공개 URL 이 내려간다.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: "R2_NOT_CONFIGURED" }, { status: 503 });
  }
  const key = (await params).key.map(decodeURIComponent).join("/");
  if (key.includes("..")) {
    return NextResponse.json({ error: "INVALID_KEY" }, { status: 400 });
  }
  try {
    const obj = await getObject(key);
    const body = await obj.Body?.transformToByteArray();
    if (!body) return new NextResponse(null, { status: 404 });
    return new NextResponse(Buffer.from(body), {
      headers: {
        "Content-Type": obj.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "NoSuchKey" || name === "NotFound") {
      return new NextResponse(null, { status: 404 });
    }
    console.error("[files] R2 read failed", error);
    return NextResponse.json({ error: "STORAGE_ERROR" }, { status: 502 });
  }
}
