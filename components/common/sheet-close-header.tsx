"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * 바텀시트 공통 헤더
 * - 타이틀 좌측 정렬
 * - 우측 44px X 버튼 / size-6 아이콘
 */
export function SheetCloseHeader({
  title,
  description,
  onClose,
  className,
  titleClassName,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  onClose: () => void;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <SheetHeader className={cn("relative px-4 pt-3 pb-1", className)}>
      <SheetTitle
        className={cn(
          "pr-12 text-left text-[16px] font-bold",
          titleClassName,
        )}
      >
        {title}
      </SheetTitle>
      {description ? (
        <div className="pr-12 text-left text-[13px] font-medium text-muted-foreground">
          {description}
        </div>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-1 right-2 size-11"
        aria-label="닫기"
        onClick={onClose}
      >
        <X className="size-6" strokeWidth={2} />
      </Button>
    </SheetHeader>
  );
}
