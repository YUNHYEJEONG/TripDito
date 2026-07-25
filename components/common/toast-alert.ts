"use client";

import { toast } from "sonner";

const TOAST_DURATION_MS = 2000;

/**
 * 공통 액션 결과 토스트
 * - 상단 노출 (시트/상세와 겹치지 않음)
 * - 앞 아이콘 없음
 * - 닫기 버튼 없음, 약 2초 후 자동 사라짐
 */
export function showToastAlert(message: string) {
  return toast(message, {
    duration: TOAST_DURATION_MS,
    closeButton: false,
    icon: null,
    position: "top-center",
    className: "toast-alert",
    unstyled: false,
  });
}

export { TOAST_DURATION_MS };
