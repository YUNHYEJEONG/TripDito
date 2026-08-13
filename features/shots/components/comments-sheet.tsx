"use client";

import { useState } from "react";
import Link from "next/link";
import { SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { SheetCloseHeader } from "@/components/common/sheet-close-header";
import { hasNickname } from "@/features/profile/constants";
import { useLocalProfile } from "@/features/profile/hooks/use-local-profile";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";
import {
  useAddShotComment,
  useRemoveShotComment,
} from "../hooks/use-shots";
import type { ShotComment } from "../schema";
import { useUnsavedChanges } from "@/lib/navigation/unsaved-changes";
import { cn } from "@/lib/utils";

const COMMENT_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatCommentTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return COMMENT_TIME_FORMATTER.format(date);
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
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [discardDraftOpen, setDiscardDraftOpen] = useState(false);
  const { data: profile } = useLocalProfile();
  const { isLoggedIn } = useIsLoggedIn();
  const addComment = useAddShotComment();
  const removeComment = useRemoveShotComment();
  const canComment = isLoggedIn && hasNickname(profile);
  const hasDraft = Boolean(text.trim());
  useUnsavedChanges(open && hasDraft);

  function requestClose() {
    setDeleteTargetId(null);
    if (hasDraft) {
      setDiscardDraftOpen(true);
      return;
    }
    onOpenChange(false);
  }

  function discardDraftAndClose() {
    setText("");
    setDiscardDraftOpen(false);
    onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canComment) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync({ id: shotId, text: trimmed });
      setText("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "댓글을 등록하지 못했어요. 다시 시도해 주세요.",
      );
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await removeComment.mutateAsync({ shotId, commentId });
      setDeleteTargetId(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "댓글을 삭제하지 못했어요. 다시 시도해 주세요.",
      );
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (next) onOpenChange(true);
          else requestClose();
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="mx-auto flex max-h-[80dvh] max-w-[480px] flex-col rounded-t-2xl"
        >
          <SheetCloseHeader
            className="shrink-0"
            title={comments.length > 0 ? `댓글 ${comments.length}` : "댓글"}
            onClose={requestClose}
          />

        <ul className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-2">
          {comments.length === 0 ? (
            <li className="py-10 text-center text-[13px] text-ink-2">
              아직 댓글이 없어요
            </li>
          ) : (
            comments.map((comment) => {
              const myId = profile?.id;
              const canDelete =
                isLoggedIn &&
                Boolean(myId) &&
                (myId === shotAuthorId || myId === comment.authorId);

              return (
                <li key={comment.id} className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-paper-3 text-[11px] font-semibold text-ink-2">
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
                          onClick={() => setDeleteTargetId(comment.id)}
                          disabled={removeComment.isPending}
                          className="flex size-11 shrink-0 items-center justify-center rounded-md text-[12px] text-ink-2 outline-none transition-colors duration-120 hover:text-ink active:text-ink focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          삭제
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 min-w-0 max-w-full break-words text-[13px] leading-snug text-ink [overflow-wrap:anywhere]">
                      {comment.text}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-2">
                      {formatCommentTime(comment.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })
          )}
        </ul>

        {canComment ? (
          <form
            onSubmit={handleSubmit}
            className="flex shrink-0 items-end gap-2 border-t border-rule bg-paper px-4 pt-2 pb-2"
          >
            <Textarea
              aria-label="댓글"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="댓글 달기…"
              maxLength={500}
              rows={1}
              className="max-h-28 min-h-11 flex-1 resize-none rounded-[22px] px-4 py-2.5 [field-sizing:content]"
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0 rounded-full"
              aria-label={addComment.isPending ? "댓글 등록 중" : "댓글 등록"}
              disabled={!text.trim() || addComment.isPending}
            >
              <SendHorizontal className="size-5" aria-hidden />
            </Button>
          </form>
        ) : (
          <div className="flex shrink-0 flex-col items-center gap-2 border-t border-rule px-4 py-4">
            <p className="text-center text-[13px] text-ink-2">
              {isLoggedIn
                ? "닉네임을 등록하면 댓글을 남길 수 있어요."
                : "로그인하면 댓글을 남길 수 있어요."}
            </p>
            <Link
              href={
                isLoggedIn
                  ? `/profile?returnTo=${encodeURIComponent(`/shots?comments=${shotId}#${shotId}`)}`
                  : `/login?returnTo=${encodeURIComponent(`/shots?comments=${shotId}#${shotId}`)}`
              }
              className={cn(buttonVariants({ size: "sm" }), "w-full max-w-xs")}
              onClick={() => onOpenChange(false)}
            >
              {isLoggedIn ? "닉네임 등록하기" : "로그인하기"}
            </Link>
          </div>
        )}
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(next) => {
          if (!next) setDeleteTargetId(null);
        }}
        title="댓글을 삭제할까요?"
        description="삭제한 댓글은 되돌릴 수 없어요."
        confirmLabel="댓글 삭제"
        loading={removeComment.isPending}
        onConfirm={() => {
          if (deleteTargetId) void handleDelete(deleteTargetId);
        }}
      />
      <ConfirmDialog
        open={discardDraftOpen}
        onOpenChange={setDiscardDraftOpen}
        title="작성 중인 댓글을 닫을까요?"
        description="입력한 댓글은 저장되지 않아요."
        cancelLabel="계속 작성"
        confirmLabel="댓글 버리기"
        onConfirm={discardDraftAndClose}
      />
    </>
  );
}
