"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreVertical,
  Send,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocalProfile } from "@/features/profile/hooks/use-local-profile";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";
import type { Shot } from "../schema";
import {
  useDeleteShot,
  useIncrementShotShare,
  useToggleShotLike,
} from "../hooks/use-shots";
import { useIsScrapped, useToggleScrap } from "../hooks/use-scraps";
import { ShotImageCarousel } from "./shot-image-carousel";
import { ShoppingListSheet } from "./shopping-list-sheet";
import { CommentsSheet } from "./comments-sheet";
import { ShareSheet } from "./share-sheet";

function formatFeedDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

const COUNT_FORMATTER = new Intl.NumberFormat("ko-KR");

function formatCount(count: number) {
  return COUNT_FORMATTER.format(count);
}

const actionButtonClassName =
  "inline-flex size-11 items-center justify-center rounded-full text-ink outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50 aria-expanded:bg-paper-2";

export function ShotPostCard({
  shot,
  preloadImage = false,
  resumeComments = false,
}: {
  shot: Shot;
  preloadImage?: boolean;
  resumeComments?: boolean;
}) {
  const router = useRouter();
  const { data: profile } = useLocalProfile();
  const { isLoggedIn } = useIsLoggedIn();
  const [expanded, setExpanded] = useState(false);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(resumeComments);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  const toggleLike = useToggleShotLike();
  const incrementShare = useIncrementShotShare();
  const toggleScrap = useToggleScrap();
  const deleteShot = useDeleteShot();
  const scrapped = useIsScrapped(shot.id);

  const isMine =
    isLoggedIn && Boolean(profile?.id && profile.id === shot.authorId);
  const body = shot.body.trim();
  const canExpandBody = body.length > 72 || body.includes("\n");

  useEffect(() => {
    if (window.location.hash !== `#${shot.id}`) return;
    const article = articleRef.current;
    if (!article) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    article.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    article.focus({ preventScroll: true });
    article.dataset.highlighted = "true";
    const timer = window.setTimeout(() => {
      delete article.dataset.highlighted;
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [shot.id]);

  async function handleLike() {
    try {
      await toggleLike.mutateAsync(shot.id);
    } catch {
      toast.error("좋아요를 반영하지 못했어요. 다시 시도해 주세요.");
    }
  }

  async function handleScrap() {
    try {
      await toggleScrap.mutateAsync(shot.id);
    } catch {
      toast.error("스크랩을 반영하지 못했어요. 다시 시도해 주세요.");
    }
  }

  function handleShared() {
    void incrementShare.mutateAsync(shot.id).catch(() => {
      /* 공유 자체는 끝났으므로 카운트 갱신 실패만 무시한다. */
    });
  }

  function handleDelete() {
    deleteShot.mutate(shot.id, {
      onSuccess: () => {
        setDeleteOpen(false);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "피드를 삭제하지 못했어요. 다시 시도해 주세요.",
        );
      },
    });
  }

  return (
    <article
      ref={articleRef}
      id={shot.id}
      tabIndex={-1}
      className="scroll-mt-24 border-b border-rule pb-5 outline-none transition-colors duration-200 data-[highlighted=true]:bg-accent/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
    >
      <header className="flex min-h-14 items-center gap-3 px-4 py-3">
        <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-paper-3 text-[13px] font-semibold text-ink-2">
          {shot.authorAvatarDataUrl ? (
            <Image
              src={shot.authorAvatarDataUrl}
              alt={`${shot.authorNickname} 프로필`}
              fill
              unoptimized
              sizes="36px"
              className="object-cover"
            />
          ) : (
            <span aria-hidden>{shot.authorNickname.slice(0, 1)}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight text-ink">
            {shot.authorNickname}
          </p>
          <p className="mt-1 truncate text-[12px] text-ink-2">
            {shot.destinationCity} · {shot.destinationCountry}
          </p>
        </div>

        {isMine ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="피드 메뉴"
              className={actionButtonClassName}
            >
              <MoreVertical
                className="size-5"
                strokeWidth={1.8}
                aria-hidden
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuItem
                onClick={() => router.push(`/shots/${shot.id}/edit`)}
              >
                수정
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </header>

      <ShotImageCarousel
        images={shot.images}
        pins={shot.pins}
        alt={
          shot.channel === "community"
            ? `${shot.authorNickname}님의 ${shot.destinationCity} 여행 이야기 사진`
            : `${shot.authorNickname}님의 ${shot.destinationCity} 때샷`
        }
        preloadFirstImage={preloadImage}
      />

      <div className="flex items-center px-2 pt-2">
        <div className="flex min-w-0 flex-1 items-center">
          <button
            type="button"
            aria-label={
              toggleLike.isPending
                ? "좋아요 반영 중"
                : shot.likedByMe
                  ? "좋아요 취소"
                  : "좋아요"
            }
            aria-pressed={shot.likedByMe}
            aria-busy={toggleLike.isPending}
            disabled={toggleLike.isPending}
            onClick={() => void handleLike()}
            className={actionButtonClassName}
          >
            <Heart
              className={cn(
                "size-6",
                shot.likedByMe && "fill-affect text-affect",
              )}
              strokeWidth={1.8}
              aria-hidden
            />
          </button>

          <button
            type="button"
            aria-label={`댓글 ${formatCount(shot.comments.length)}개 보기`}
            onClick={() => setCommentsOpen(true)}
            className={actionButtonClassName}
          >
            <MessageCircle
              className="size-6"
              strokeWidth={1.8}
              aria-hidden
            />
          </button>

          <button
            type="button"
            aria-label="공유"
            onClick={() => setShareOpen(true)}
            className={actionButtonClassName}
          >
            <Send className="size-6" strokeWidth={1.8} aria-hidden />
          </button>

          {shot.shoppingItemIds.length > 0 ? (
            <button
              type="button"
              onClick={() => setShoppingOpen(true)}
              aria-haspopup="dialog"
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-2 text-[12px] font-semibold text-ink outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <ShoppingBag className="size-5" strokeWidth={1.8} aria-hidden />
              {isMine ? "내 목록" : "담기"}
            </button>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={
            toggleScrap.isPending
              ? "스크랩 반영 중"
              : scrapped
                ? "스크랩 해제"
                : "스크랩"
          }
          aria-pressed={scrapped}
          aria-busy={toggleScrap.isPending}
          disabled={toggleScrap.isPending}
          onClick={() => void handleScrap()}
          className={actionButtonClassName}
        >
          <Bookmark
            className={cn("size-6", scrapped && "fill-ink text-ink")}
            strokeWidth={1.8}
            aria-hidden
          />
        </button>
      </div>

      <div className="px-4">
        <p className="text-[14px] font-semibold text-ink tabular-nums">
          좋아요 {formatCount(shot.likeCount)}개
        </p>

        {body ? (
          <div className="mt-1">
            <p
              className={cn(
                "min-w-0 max-w-full break-words text-[15px] leading-[1.5] whitespace-pre-wrap text-ink [overflow-wrap:anywhere]",
                canExpandBody && !expanded && "line-clamp-2",
              )}
            >
              <span className="font-semibold">{shot.authorNickname}</span>{" "}
              {body}
            </p>
            {canExpandBody ? (
              <button
                type="button"
                aria-expanded={expanded}
                className="mt-1 min-h-11 text-[13px] text-ink-2 outline-none hover:text-ink active:text-ink focus-visible:underline"
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? "접기" : "더보기"}
              </button>
            ) : null}
          </div>
        ) : null}

        {shot.comments.length > 0 ? (
          <button
            type="button"
            className="mt-1 block min-h-11 text-[13px] text-ink-2 outline-none hover:text-ink active:text-ink focus-visible:underline"
            onClick={() => setCommentsOpen(true)}
          >
            댓글 {formatCount(shot.comments.length)}개 모두 보기
          </button>
        ) : null}

        <p className="mt-1 text-[12px] font-medium text-ink-2 tabular-nums">
          {formatFeedDate(shot.createdAt)}
        </p>
      </div>

      {shoppingOpen ? (
        <ShoppingListSheet
          open
          onOpenChange={setShoppingOpen}
          nickname={shot.authorNickname}
          shotAuthorId={shot.authorId}
          tripId={shot.tripId}
          destinationCity={shot.destinationCity}
          itemIds={shot.shoppingItemIds}
          shotId={shot.id}
        />
      ) : null}
      {commentsOpen ? (
        <CommentsSheet
          open
          onOpenChange={setCommentsOpen}
          shotId={shot.id}
          shotAuthorId={shot.authorId}
          comments={shot.comments}
        />
      ) : null}
      {shareOpen ? (
        <ShareSheet
          open
          onOpenChange={setShareOpen}
          shotId={shot.id}
          nickname={shot.authorNickname}
          onShared={handleShared}
        />
      ) : null}
      {deleteOpen ? (
        <ConfirmDialog
          open
          onOpenChange={setDeleteOpen}
          title="피드를 삭제할까요?"
          description="삭제한 피드는 되돌릴 수 없어요."
          confirmLabel="삭제"
          loading={deleteShot.isPending}
          onConfirm={handleDelete}
        />
      ) : null}
    </article>
  );
}
