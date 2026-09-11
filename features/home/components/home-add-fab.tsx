"use client";

import { useState } from "react";
import { AddFromImagesSheet } from "@/features/image-upload/components/add-from-images-sheet";
import { cn } from "@/lib/utils";

/**
 * 홈 우측 하단 "사진으로 상품 추가" FAB (카메라 + 아이콘).
 * 탭바 위에 떠 있고, 누르면 다가오는 여행의 사진 분석 시트가 열린다.
 * 폭은 AppShell 콘텐츠 최대폭(480/720/960)에 맞춰 오른쪽 여백 안쪽에 붙인다.
 */
export function HomeAddFab({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 z-30",
          "bottom-[calc(var(--tab-bar-height)+1rem+env(safe-area-inset-bottom))]",
        )}
      >
        <div className="mx-auto flex w-full max-w-[480px] justify-end px-4 sm:px-5 md:max-w-[720px] md:px-6 lg:max-w-[960px] lg:px-8">
          <button
            type="button"
            aria-label="사진으로 상품 추가"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className={cn(
              "pointer-events-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground",
              "shadow-[0_8px_24px_-8px_rgba(25,31,40,0.45)] transition-transform active:scale-95",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
            )}
          >
            <CameraPlusIcon className="size-7" />
          </button>
        </div>
      </div>
      <AddFromImagesSheet tripId={tripId} open={open} onOpenChange={setOpen} />
    </>
  );
}

/** 카메라 본체 + 렌즈 자리에 + */
function CameraPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <path d="M12 10.5v5" />
      <path d="M9.5 13h5" />
    </svg>
  );
}
