"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { Loader2Icon } from "lucide-react";

/**
 * 공통 액션 결과 토스트 규정
 * - 슬라이드(시트) 상세가 열려 있어도 본문과 겹치지 않도록 상단 노출
 * - 파란 카드 + 흰 텍스트 / 액션 버튼은 흰 배경
 * - 앞에 상태 아이콘 없음 (로딩만 표시)
 * - 문장 말맺음은 마침표(.) 사용 (`@/components/common/toast-alert`의 toast 사용)
 */
const TOAST_TOP_OFFSET =
  "calc(env(safe-area-inset-top, 0px) + 0.75rem)";

/** 좌우 화면 마진 */
const TOAST_SIDE_MARGIN = "1rem";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group z-[200]"
      position="top-center"
      closeButton={false}
      offset={{
        top: TOAST_TOP_OFFSET,
        left: TOAST_SIDE_MARGIN,
        right: TOAST_SIDE_MARGIN,
      }}
      mobileOffset={{
        top: TOAST_TOP_OFFSET,
        left: TOAST_SIDE_MARGIN,
        right: TOAST_SIDE_MARGIN,
      }}
      icons={{
        success: null,
        info: null,
        warning: null,
        error: null,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--primary)",
          "--normal-text": "#ffffff",
          "--normal-border": "transparent",
          "--success-bg": "var(--primary)",
          "--success-text": "#ffffff",
          "--success-border": "transparent",
          "--error-bg": "var(--primary)",
          "--error-text": "#ffffff",
          "--error-border": "transparent",
          "--warning-bg": "var(--primary)",
          "--warning-text": "#ffffff",
          "--warning-border": "transparent",
          "--info-bg": "var(--primary)",
          "--info-text": "#ffffff",
          "--info-border": "transparent",
          "--border-radius": "0.875rem",
          "--width": "22rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          title: "text-white",
          description: "text-white/90",
          actionButton:
            "!bg-white !text-primary hover:!bg-white/90 !border-0",
          cancelButton:
            "!bg-white/15 !text-white hover:!bg-white/25 !border-0",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
