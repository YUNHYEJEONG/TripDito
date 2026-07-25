import { NextResponse } from "next/server";
import {
  fetchKoreaEximCompare,
  isKoreaEximSupported,
} from "@/features/fx/lib/koreaexim";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authKey = process.env.KOREAEXIM_AUTH_KEY?.trim();
  if (!authKey) {
    return NextResponse.json(
      { error: "MISSING_AUTH_KEY" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const currency = (searchParams.get("currency") ?? "").toUpperCase();

  if (!currency || currency === "KRW") {
    return NextResponse.json(
      { error: "INVALID_CURRENCY" },
      { status: 400 },
    );
  }

  if (!isKoreaEximSupported(currency)) {
    return NextResponse.json(
      { error: "UNSUPPORTED_CURRENCY", currency },
      { status: 400 },
    );
  }

  try {
    const data = await fetchKoreaEximCompare(authKey, currency);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "FX_FETCH_FAILED";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
