"use client";

import { Link2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SheetCloseHeader } from "@/components/common/sheet-close-header";

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
      toast.success("링크를 복사했습니다");
      finishShare();
    } catch {
      toast.error("링크 복사에 실패했습니다");
    }
  }

  async function shareKakao() {
    const text = `${nickname} 님의 때샷 — 트립디토`;
    try {
      if (navigator.share) {
        await navigator.share({ title: text, text, url: shareUrl });
        finishShare();
        return;
      }
    } catch {
      // user cancel or unsupported — fall through
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
        className="mx-auto max-w-[480px] rounded-t-2xl md:max-w-[720px] lg:max-w-[960px]"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#D1D5DB]" />
        <SheetCloseHeader
          title="공유하기"
          onClose={() => onOpenChange(false)}
        />

        <div className="mt-3 grid grid-cols-2 gap-3 px-4 pb-6">
          <button
            type="button"
            onClick={() => void shareKakao()}
            className="flex flex-col items-center gap-2 rounded-2xl bg-[#FEE500] px-3 py-4 text-[#191600] transition-opacity hover:opacity-90"
          >
            <MessageCircle className="size-6" />
            <span className="text-[13px] font-semibold">카카오톡</span>
          </button>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="flex flex-col items-center gap-2 rounded-2xl bg-[#F2F4F6] px-3 py-4 text-foreground transition-colors hover:bg-[#E8ECF0]"
          >
            <Link2 className="size-6" />
            <span className="text-[13px] font-semibold">링크 복사</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
