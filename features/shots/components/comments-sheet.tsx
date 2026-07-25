"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SheetCloseHeader } from "@/components/common/sheet-close-header";
import { useLocalProfile } from "@/features/profile/hooks/use-local-profile";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";
import {
  useAddShotComment,
  useRemoveShotComment,
} from "../hooks/use-shots";
import type { ShotComment } from "../schema";
import { cn } from "@/lib/utils";

function formatCommentTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function CommentsSheet({
  open,
  onOpenChange,
  shotId,
  shotAuthorId,
  comments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shotId: string;
  shotAuthorId: string;
  comments: ShotComment[];
}) {
  const [text, setText] = useState("");
  const { data: profile } = useLocalProfile();
  const { isLoggedIn } = useIsLoggedIn();
  const addComment = useAddShotComment();
  const removeComment = useRemoveShotComment();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync({ id: shotId, text: trimmed });
      setText("");
      toast.success("댓글을 남겼습니다");
    } catch {
      toast.error("댓글 등록에 실패했습니다");
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await removeComment.mutateAsync({ shotId, commentId });
      toast.success("댓글을 삭제했습니다");
    } catch {
      toast.error("댓글 삭제에 실패했습니다");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto flex max-h-[80vh] max-w-[480px] flex-col rounded-t-2xl md:max-w-[720px] lg:max-w-[960px]"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#D1D5DB]" />
        <SheetCloseHeader
          className="shrink-0"
          title={comments.length > 0 ? `댓글 ${comments.length}` : "댓글"}
          onClose={() => onOpenChange(false)}
        />

        <ul className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-2">
          {comments.length === 0 ? (
            <li className="py-10 text-center text-[13px] text-muted-foreground">
              첫번째 댓글을 남겨주세요!
            </li>
          ) : (
            comments.map((comment) => {
              const myId = profile?.id;
              const canDelete =
                isLoggedIn &&
                Boolean(myId) &&
                (myId === shotAuthorId || myId === comment.authorId);

              return (
                <li key={comment.id} className="flex gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E8ECF0] text-[11px] font-semibold text-[#4E5968]">
                    {comment.authorNickname.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 truncate text-[13px] font-semibold">
                        {comment.authorNickname}
                      </p>
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => void handleDelete(comment.id)}
                          disabled={removeComment.isPending}
                          className="shrink-0 text-[12px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                        >
                          삭제
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[13px] leading-snug text-foreground">
                      {comment.text}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatCommentTime(comment.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })
          )}
        </ul>

        {isLoggedIn ? (
          <form
            onSubmit={handleSubmit}
            className="flex shrink-0 flex-col gap-2 border-t border-[#EAEDED] px-4 py-3"
          >
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="댓글 달기…"
              rows={1}
              className="min-h-10 resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!text.trim() || addComment.isPending}
              >
                등록
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex shrink-0 flex-col items-center gap-2 border-t border-[#EAEDED] px-4 py-4">
            <p className="text-center text-[13px] text-muted-foreground">
              로그인 후, 댓글을 달아주세요.
            </p>
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "sm" }), "w-full max-w-xs")}
              onClick={() => onOpenChange(false)}
            >
              로그인 하기
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
