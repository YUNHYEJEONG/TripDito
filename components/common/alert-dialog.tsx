"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * 공통 얼럿/안내 다이얼로그
 * - 제목·본문 중앙 정렬
 * - 작업 중에는 닫기를 막고 확인 버튼에 진행 상태를 노출
 */
export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "닫기",
  showCancel = true,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  loading?: boolean;
  onConfirm?: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading) onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="gap-4 px-5 py-5 sm:max-w-[22.5rem]"
      >
        <div className="flex min-h-8 items-center justify-center">
          <DialogTitle className="text-center text-[17px] font-bold leading-snug tracking-tight text-foreground">
            {title}
          </DialogTitle>
        </div>

        {description ? (
          <DialogDescription className="text-center text-[14px] leading-relaxed text-ink-2">
            {description}
          </DialogDescription>
        ) : null}

        <DialogFooter className="flex-row gap-2 sm:justify-stretch">
          {showCancel ? (
            <Button
              variant="outline"
              className="h-11 flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            className="h-11 flex-1"
            onClick={() => {
              onConfirm?.();
              if (!onConfirm) onOpenChange(false);
            }}
            disabled={loading}
            loading={loading}
            loadingLabel="처리 중…"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
