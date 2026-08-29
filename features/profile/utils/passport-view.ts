import { getSafeReturnTo } from "@/lib/navigation/return-to";

export type PassportView = "trips" | "stamps";

type PassportViewValue = string | string[] | null | undefined;

/** 알 수 없는 딥링크는 여행 관리 기본 화면으로 안전하게 되돌린다. */
export function getPassportView(value: PassportViewValue): PassportView {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "stamps" ? "stamps" : "trips";
}

export function getPassportViewHref(view: PassportView) {
  return view === "stamps" ? "/passport?view=stamps" : "/passport";
}

export function getPassportStampTripId(value: PassportViewValue) {
  const candidate = (Array.isArray(value) ? value[0] : value)?.trim();
  if (
    !candidate ||
    candidate.length > 200 ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return null;
  }
  return candidate;
}

export function getPassportStampPageNumber(value: PassportViewValue) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !/^\d{1,3}$/.test(candidate)) return null;
  const pageNumber = Number(candidate);
  return Number.isSafeInteger(pageNumber) && pageNumber > 0 && pageNumber <= 100
    ? pageNumber
    : null;
}

/** Keeps the server and first hydrated accessibility tree independent of local storage. */
export function getPassportStampHeadingLabel(
  isLoading: boolean,
  completedTripCount: number,
) {
  if (isLoading) return "여행 도장";
  const safeCount = Number.isFinite(completedTripCount)
    ? Math.max(0, Math.floor(completedTripCount))
    : 0;
  return `여행 도장 · 완료한 여행 ${safeCount}개`;
}
/** Public entry point for a completed-trip footer. */
export function getPassportStampIntentHref(
  tripId: string,
  returnTo: string,
  pageNumber?: number,
) {
  const safeTripId = getPassportStampTripId(tripId);
  if (!safeTripId) return getPassportViewHref("stamps");

  const params = new URLSearchParams({
    view: "stamps",
    stampTripId: safeTripId,
    returnTo: getSafeReturnTo(returnTo, getPassportViewHref("stamps")),
  });
  if (
    pageNumber !== undefined &&
    Number.isSafeInteger(pageNumber) &&
    pageNumber > 0 &&
    pageNumber <= 100
  ) {
    params.set("stampPage", String(pageNumber));
  }
  return `/passport?${params.toString()}`;
}
