import { NextResponse } from "next/server";
import { fetchFrankfurterCompare } from "@/features/fx/lib/frankfurter";
import {
  clearKoreaEximCaches,
  fetchKoreaEximCompare,
  isKoreaEximSupported,
} from "@/features/fx/lib/koreaexim";
import { todayKstIso } from "@/features/fx/lib/fx-schedule";

export const dynamic = "force-dynamic";

function withUpdatedDate<T extends Record<string, unknown>>(data: T) {
  return { ...data, updatedDate: todayKstIso() };
}

function errorStatus(message: string): number {
  if (message === "MISSING_AUTH_KEY" || message === "AUTH_ERROR") return 500;
  if (
    message === "INVALID_CURRENCY" ||
    message.startsWith("UNSUPPORTED_CURRENCY")
  ) {
    return 400;
  }
  if (message === "RATE_LIMITED") return 429;
  return 502;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currency = (searchParams.get("currency") ?? "").toUpperCase();
  const forceRefresh = searchParams.get("refresh") === "1";

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

  if (forceRefresh) {
    clearKoreaEximCaches();
  }

  const authKey = process.env.KOREAEXIM_AUTH_KEY?.trim();

  // 1순위: 한국수출입은행
  if (authKey) {
    try {
      const data = await fetchKoreaEximCompare(authKey, currency);
      return NextResponse.json(withUpdatedDate(data));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "FX_FETCH_FAILED";
      // 한도/일시 장애 시 폴백 시도
      if (
        message !== "AUTH_ERROR" &&
        message !== "UNSUPPORTED_CURRENCY"
      ) {
        try {
          const fallback = await fetchFrankfurterCompare(currency);
          return NextResponse.json(withUpdatedDate(fallback));
        } catch {
          return NextResponse.json(
            { error: message },
            { status: errorStatus(message) },
          );
        }
      }
      return NextResponse.json(
        { error: message },
        { status: errorStatus(message) },
      );
    }
  }

  // 인증키 없으면 Frankfurter만 사용
  try {
    const fallback = await fetchFrankfurterCompare(currency);
    return NextResponse.json(withUpdatedDate(fallback));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "FX_FETCH_FAILED";
    return NextResponse.json(
      { error: message === "FRANKFURTER_NO_RATE" ? "MISSING_AUTH_KEY" : message },
      { status: errorStatus(message) },
    );
  }
}
