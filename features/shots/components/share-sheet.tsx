"use client";

import { Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SheetCloseHeader } from "@/components/common/sheet-close-header";
import { appConfig } from "@/config/app";

export function ShareSheet({
  open,
  onOpenChange,
  shotId,
  nickname,
  onShared,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shotId: string;
  nickname: string;
  onShared?: () => void;
}) {
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/shots#${shotId}`
      : `/shots#${shotId}`;

  function finishShare() {
    onShared?.();
    onOpenChange(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("링크를 복사했어요");
      finishShare();
    } catch {
      toast.error("링크를 복사하지 못했어요. 다시 시도해 주세요.");
    }
  }

  async function shareFromDevice() {
    const text = `${nickname}님의 때샷 - ${appConfig.name}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: text, text, url: shareUrl });
        finishShare();
        return;
      }
    } catch {
      // 공유 창을 닫은 경우 다른 창을 다시 열지 않는다.
      return;
    }

    const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}`;
    window.open(kakaoUrl, "_blank", "noopener,noreferrer");
    finishShare();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-w-[480px] rounded-t-2xl"
      >
        <SheetCloseHeader
          title="공유하기"
          onClose={() => onOpenChange(false)}
        />

        <div className="mt-3 grid grid-cols-2 gap-3 px-4 pb-6">
          <button
            type="button"
            onClick={() => void shareFromDevice()}
            className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl bg-paper-2 px-3 py-4 text-ink outline-none transition-colors duration-120 hover:bg-paper-3 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
          >
            <Share2 className="size-6" strokeWidth={1.8} />
            <span className="text-[13px] font-semibold">공유하기</span>
          </button>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl bg-paper-2 px-3 py-4 text-ink outline-none transition-colors duration-120 hover:bg-paper-3 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
          >
            <Link2 className="size-6" strokeWidth={1.8} />
            <span className="text-[13px] font-semibold">링크 복사</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
