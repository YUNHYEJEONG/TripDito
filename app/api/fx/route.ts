import { NextResponse } from "next/server";
import {
  fetchFrankfurterCompare,
  isFrankfurterSupported,
} from "@/features/fx/lib/frankfurter";
import {
  fetchKoreaEximCompare,
  isKoreaEximSupported,
} from "@/features/fx/lib/koreaexim";
import { todayKstIso } from "@/features/fx/lib/fx-schedule";

export const dynamic = "force-dynamic";

function withUpdatedDate<T extends Record<string, unknown>>(data: T) {
  return { ...data, updatedDate: todayKstIso() };
}

function errorStatus(message: string) {
  if (message === "MISSING_AUTH_KEY" || message === "AUTH_ERROR") return 500;
  if (message === "RATE_LIMITED") return 429;
  if (message === "INVALID_CURRENCY" || message.startsWith("UNSUPPORTED_CURRENCY")) return 400;
  return 502;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currency = (searchParams.get("currency") ?? "").toUpperCase();
  if (!currency || currency === "KRW") {
    return NextResponse.json({ error: "INVALID_CURRENCY" }, { status: 400 });
  }
  if (!isKoreaEximSupported(currency)) {
    return NextResponse.json({ error: "UNSUPPORTED_CURRENCY", currency }, { status: 400 });
  }

  const authKey = process.env.KOREAEXIM_AUTH_KEY?.trim();

  if (!authKey && !isFrankfurterSupported(currency)) {
    return NextResponse.json(
      { error: "RATE_PROVIDER_NOT_CONFIGURED", currency },
      { status: 503 },
    );
  }

  if (authKey) {
    try {
      return NextResponse.json(
        withUpdatedDate(await fetchKoreaEximCompare(authKey, currency)),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "FX_FETCH_FAILED";
      if (message !== "AUTH_ERROR" && !message.startsWith("UNSUPPORTED_CURRENCY")) {
        try {
          return NextResponse.json(withUpdatedDate(await fetchFrankfurterCompare(currency)));
        } catch {
          // Preserve the primary error because it is more actionable.
        }
      }
      return NextResponse.json({ error: message }, { status: errorStatus(message) });
    }
  }

  try {
    return NextResponse.json(withUpdatedDate(await fetchFrankfurterCompare(currency)));
  } catch (error) {
    const message = error instanceof Error ? error.message : "FX_FETCH_FAILED";
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
