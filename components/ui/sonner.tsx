"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { Loader2Icon } from "lucide-react";

/**
 * 공통 액션 결과 토스트 규정
 * - 슬라이드(시트) 상세가 열려 있어도 본문과 겹치지 않도록 상단 노출
 * - 앞에 상태 아이콘 없음 (로딩만 표시)
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
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--width": "22rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          actionButton:
            "!bg-primary !text-primary-foreground hover:!bg-[#1b64da]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
