"use client";

import { XIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * 공통 컨펌 다이얼로그
 * - 제목·본문 중앙 정렬, 제목과 X 수직 중앙 정렬
 * - 하단 버튼: 닫기(좌) + 확인(우) 가로 배치
 * - 버튼 색상(variant)은 기존 유지
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "삭제",
  cancelLabel = "닫기",
  loading,
  onConfirm,
  confirmVariant = "destructive",
  hideCancel = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  confirmVariant?: "destructive" | "default";
  /** true면 확인 버튼만 (Alert) */
  hideCancel?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-4 px-5 pt-3.5 pb-5 sm:max-w-[22.5rem]"
      >
        <div className="relative flex min-h-8 items-center justify-center">
          <DialogTitle className="px-9 text-center text-[17px] font-bold leading-snug tracking-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-0 size-8 -translate-y-1/2 text-foreground hover:bg-transparent"
              />
            }
          >
            <XIcon className="size-5" strokeWidth={2} />
            <span className="sr-only">닫기</span>
          </DialogClose>
        </div>

        {description ? (
          <DialogDescription className="whitespace-pre-line text-center text-[14px] leading-relaxed text-[#3C4043]">
            {description}
          </DialogDescription>
        ) : null}

        <DialogFooter className="flex-row gap-2 sm:justify-stretch">
          {hideCancel ? null : (
            <Button
              variant="outline"
              className="h-11 flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={confirmVariant}
            className="h-11 flex-1"
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
