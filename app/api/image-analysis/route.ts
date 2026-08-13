import { NextResponse } from "next/server";
import { analyzeWithFallback } from "@/features/image-analysis/resolve-analyzer";
import type {
  AnalyzableImage,
  ImageAnalysisContext,
} from "@/features/image-analysis/port";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
export const runtime = "nodejs";

const MAX_IMAGES = 12;
const MAX_DATA_URL_LENGTH = 5_500_000;
const MAX_TOTAL_DATA_URL_LENGTH = 24_000_000;

type AnalyzeBody = {
  images?: AnalyzableImage[];
  context?: ImageAnalysisContext;
};

export async function POST(request: Request) {
  let body: AnalyzeBody;
  try {
    body = (await request.json()) as AnalyzeBody;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const images = body.images ?? [];
  const context = body.context;

  if (!images.length) {
    return NextResponse.json({ error: "NO_IMAGES" }, { status: 400 });
  }
  if (images.length > MAX_IMAGES) {
    return NextResponse.json({ error: "TOO_MANY_IMAGES" }, { status: 413 });
  }
  if (!context?.city || !context.country || !context.currency) {
    return NextResponse.json({ error: "MISSING_CONTEXT" }, { status: 400 });
  }
  if (
    context.city.length > 100 ||
    context.country.length > 100 ||
    !/^[A-Za-z]{3}$/.test(context.currency)
  ) {
    return NextResponse.json({ error: "INVALID_CONTEXT" }, { status: 400 });
  }

  let totalLength = 0;
  for (const image of images) {
    if (
      !image?.id ||
      image.id.length > 128 ||
      (image.fileName?.length ?? 0) > 255 ||
      typeof image.dataUrl !== "string" ||
      !/^data:image\/(?:jpeg|png|webp);base64,/i.test(image.dataUrl)
    ) {
      return NextResponse.json({ error: "INVALID_IMAGE" }, { status: 400 });
    }
    totalLength += image.dataUrl.length;
    if (image.dataUrl.length > MAX_DATA_URL_LENGTH) {
      return NextResponse.json({ error: "IMAGE_TOO_LARGE" }, { status: 413 });
    }
  }
  if (totalLength > MAX_TOTAL_DATA_URL_LENGTH) {
    return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }

  try {
    const result = await analyzeWithFallback(images, context);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ANALYSIS_FAILED";
    console.error("[image-analysis]", message);
    return NextResponse.json(
      {
        error: "ANALYSIS_FAILED",
        message: "이미지 분석 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
      },
      { status: 502 },
    );
  }
}
