const INTERNAL_ORIGIN = "https://tripdito.local";

type ReturnToValue = string | string[] | null | undefined;

function normalizeInternalPath(value: string | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//")) return null;

  try {
    const url = new URL(value, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** 외부 URL이나 프로토콜 상대 URL을 거부하고 앱 내부 경로만 반환한다. */
export function getSafeReturnTo(
  value: ReturnToValue,
  fallback = "/home",
) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return (
    normalizeInternalPath(candidate ?? undefined) ??
    normalizeInternalPath(fallback) ??
    "/home"
  );
}

/** 대상 경로의 기존 쿼리·해시를 유지하면서 검증된 returnTo를 덧붙인다. */
export function withReturnTo(href: string, returnTo: ReturnToValue) {
  const target = new URL(href, INTERNAL_ORIGIN);
  if (target.origin !== INTERNAL_ORIGIN) return "/home";

  target.searchParams.set("returnTo", getSafeReturnTo(returnTo));
  return `${target.pathname}${target.search}${target.hash}`;
}
