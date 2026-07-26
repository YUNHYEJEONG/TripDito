"use client";

import { toast as sonnerToast, type ExternalToast } from "sonner";

const TOAST_DURATION_MS = 2000;

/**
 * 토스트 문장 말맺음 규칙
 * - 문장형 메시지는 마침표(.)로 끝냄
 * - 이미 . ! ? 。 … 로 끝나면 그대로 둠
 */
export function ensureToastPeriod(message: string): string {
  const trimmed = message.trimEnd();
  if (!trimmed) return trimmed;
  if (/[.!?。…]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

function withPeriod(
  message: string | React.ReactNode,
): string | React.ReactNode {
  return typeof message === "string" ? ensureToastPeriod(message) : message;
}

/**
 * 공통 액션 결과 토스트
 * - 상단 노출 (시트/상세와 겹치지 않음)
 * - 앞 아이콘 없음
 * - 닫기 버튼 없음, 약 2초 후 자동 사라짐
 * - 문장 말맺음 '.' 강제
 */
export function showToastAlert(message: string) {
  return sonnerToast(ensureToastPeriod(message), {
    duration: TOAST_DURATION_MS,
    closeButton: false,
    icon: null,
    position: "top-center",
    className: "toast-alert",
    unstyled: false,
  });
}

type ToastMessage = string | React.ReactNode;

function wrapToastFn(
  fn: (message: ToastMessage, data?: ExternalToast) => string | number,
) {
  return (message: ToastMessage, data?: ExternalToast) =>
    fn(withPeriod(message), data);
}

/** sonner toast 래퍼 — 모든 메시지에 말맺음 '.' 적용 */
export const toast = Object.assign(wrapToastFn(sonnerToast), {
  success: wrapToastFn(sonnerToast.success),
  error: wrapToastFn(sonnerToast.error),
  warning: wrapToastFn(sonnerToast.warning),
  message: wrapToastFn(sonnerToast.message),
  info: wrapToastFn(sonnerToast.info),
  loading: wrapToastFn(sonnerToast.loading),
  dismiss: sonnerToast.dismiss,
  promise: sonnerToast.promise,
  custom: sonnerToast.custom,
});

export { TOAST_DURATION_MS };
