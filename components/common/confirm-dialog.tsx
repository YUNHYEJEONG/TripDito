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
 * 공통 컨펌 다이얼로그
 * - 제목·본문 중앙 정렬
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
          <Button
            variant="outline"
            className="h-11 flex-1"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            className="h-11 flex-1"
            onClick={onConfirm}
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
