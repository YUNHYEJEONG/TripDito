import { NextResponse } from "next/server";
import { analyzeWithFallback } from "@/features/image-analysis/resolve-analyzer";
import type {
  AnalyzableImage,
  ImageAnalysisContext,
} from "@/features/image-analysis/port";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

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
  if (!context?.city || !context.country || !context.currency) {
    return NextResponse.json({ error: "MISSING_CONTEXT" }, { status: 400 });
  }

  // dataUrl이 클 수 있어 장당 상한 (대략 4MB base64)
  for (const image of images) {
    if ((image.dataUrl?.length ?? 0) > 5_500_000) {
      return NextResponse.json({ error: "IMAGE_TOO_LARGE" }, { status: 413 });
    }
  }

  try {
    const result = await analyzeWithFallback(images, context);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ANALYSIS_FAILED";
    console.error("[image-analysis]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
