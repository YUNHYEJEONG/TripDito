/** 브라우저 → /api/* 호출 공통 래퍼 */

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    public issues?: unknown,
  ) {
    super(messageFor(status, code));
    this.name = "ApiClientError";
  }
}

const MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "로그인이 필요합니다",
  TRIP_NOT_FOUND: "여행을 찾을 수 없습니다",
  ITEM_NOT_FOUND: "상품을 찾을 수 없습니다",
  SHOT_NOT_FOUND: "피드를 찾을 수 없습니다",
  COMMENT_NOT_FOUND: "댓글을 찾을 수 없습니다",
  COUPON_NOT_FOUND: "쿠폰을 찾을 수 없습니다",
  FORBIDDEN: "권한이 없습니다",
  INVALID_COUNTRY: "지원하지 않는 국가입니다 (일본·중국·대만·태국·한국)",
  INVALID_CURRENCY: "지원하지 않는 통화입니다",
  INVALID_GIFT_TAG: "지원하지 않는 선물 태그입니다",
  INVALID_ATTACHMENT: "이미지를 1장 이상 10장 이하로 등록하세요",
  INVALID_SHOPPING_ITEMS: "연결한 쇼핑품목이 올바르지 않습니다",
  R2_NOT_CONFIGURED: "이미지 저장소(R2)가 아직 설정되지 않았습니다",
  UNSUPPORTED_IMAGE_TYPE: "jpg·png·webp·gif 이미지만 올릴 수 있어요",
  UPLOAD_NOT_FOUND: "이미지 업로드가 완료되지 않았습니다. 다시 시도해 주세요",
  INVALID_UPLOAD_KEY: "잘못된 업로드 요청입니다",
  FILE_TOO_LARGE: "이미지는 10MB 이하만 올릴 수 있어요",
  ATTACHMENT_ALREADY_REGISTERED: "이미 등록된 이미지입니다",
  VALIDATION: "입력값을 확인하세요",
};

function messageFor(status: number, code: string) {
  return MESSAGES[code] ?? (status >= 500 ? "서버 오류가 발생했습니다" : code);
}

export function isUnauthorized(error: unknown) {
  return error instanceof ApiClientError && error.status === 401;
}

export async function api<T>(
  path: string,
  init?: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<T> {
  const { body, headers, ...rest } = init ?? {};
  const res = await fetch(path, {
    ...rest,
    cache: "no-store",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // 본문 없음
  }

  if (!res.ok) {
    const payload = (data ?? {}) as { error?: string; issues?: unknown };
    throw new ApiClientError(
      res.status,
      payload.error ?? `HTTP_${res.status}`,
      payload.issues,
    );
  }
  return data as T;
}
