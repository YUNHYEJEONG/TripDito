"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreVertical,
  Plus,
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

function formatCount(n: number) {
  return new Intl.NumberFormat("ko-KR").format(n);
}

export function ShotPostCard({ shot }: { shot: Shot }) {
  const router = useRouter();
  const { data: profile } = useLocalProfile();
  const [expanded, setExpanded] = useState(false);
  const [needsClamp, setNeedsClamp] = useState(false);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  const toggleLike = useToggleShotLike();
  const incrementShare = useIncrementShotShare();
  const toggleScrap = useToggleScrap();
  const deleteShot = useDeleteShot();
  const scrapped = useIsScrapped(shot.id);

  const { isLoggedIn } = useIsLoggedIn();
  const isMine =
    isLoggedIn && Boolean(profile?.id && profile.id === shot.authorId);
  const body = shot.body.trim();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== `#${shot.id}`) return;
    setHighlight(true);
    const el = document.getElementById(shot.id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    const timer = window.setTimeout(() => setHighlight(false), 1800);
    return () => window.clearTimeout(timer);
  }, [shot.id]);

  useEffect(() => {
    setExpanded(false);
  }, [shot.id, body]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || !body) {
      setNeedsClamp(false);
      return;
    }

    function measure() {
      if (!bodyRef.current || expanded) return;
      const { scrollHeight, clientHeight } = bodyRef.current;
      setNeedsClamp(scrollHeight > clientHeight + 1);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [body, expanded]);

  async function handleLike() {
    try {
      await toggleLike.mutateAsync(shot.id);
    } catch {
      toast.error("좋아요 처리에 실패했습니다");
    }
  }

  async function handleScrap() {
    try {
      await toggleScrap.mutateAsync(shot.id);
    } catch {
      toast.error("스크랩 처리에 실패했습니다");
    }
  }

  function handleShared() {
    void incrementShare.mutateAsync(shot.id).catch(() => {
      /* count is best-effort */
    });
  }

  function handleDelete() {
    deleteShot.mutate(shot.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        toast.success("피드를 삭제했습니다");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "삭제에 실패했습니다",
        );
      },
    });
  }

  return (
    <article
      id={shot.id}
      className={cn(
        "-mx-4 border-b border-[#EAEDED] pb-4 sm:-mx-5 md:-mx-6 lg:-mx-8",
        highlight && "bg-primary/5",
      )}
    >
      <header className="flex items-center gap-2.5 px-4 py-3 sm:px-5 md:px-6 lg:px-8">
        <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8ECF0] text-[13px] font-semibold text-[#4E5968]">
          {shot.authorAvatarDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shot.authorAvatarDataUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            shot.authorNickname.slice(0, 1)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight">
            {shot.authorNickname}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {shot.destinationCity} · {shot.destinationCountry}
          </p>
        </div>
        {isMine ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="더보기"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[#4E5968] transition-colors hover:bg-[#F2F4F6]"
            >
              <MoreVertical className="size-5" strokeWidth={1.75} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuItem
                onClick={() => router.push(`/shots/${shot.id}/edit`)}
              >
                수정
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
              >
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </header>

      <ShotImageCarousel images={shot.images} pins={shot.pins} />

      {shot.shoppingItemIds.length > 0 ? (
        <button
          type="button"
          onClick={() => setShoppingOpen(true)}
          className="mx-4 mt-3 mb-2 flex w-[calc(100%-2rem)] items-center gap-2 rounded-xl bg-[#F2F4F6] px-3 py-2.5 text-left transition-colors hover:bg-[#E8ECF0] sm:mx-5 sm:w-[calc(100%-2.5rem)] md:mx-6 md:w-[calc(100%-3rem)] lg:mx-8 lg:w-[calc(100%-4rem)]"
        >
          <ShoppingBag className="size-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-normal text-foreground">
            <span className="font-bold">{shot.authorNickname}</span>
            {" 님의 쇼핑리스트 목록"}
          </span>
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-[#CFD4DA] bg-background text-primary">
            <Plus className="size-3.5" strokeWidth={2.5} />
          </span>
        </button>
      ) : null}

      <div className="flex items-center px-4 py-1.5 sm:px-5 md:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-4">
          <ActionButton
            label="좋아요"
            onClick={handleLike}
            count={shot.likeCount}
          >
            <Heart
              className={cn(
                "size-6",
                shot.likedByMe && "fill-[#F04452] text-[#F04452]",
              )}
              strokeWidth={1.75}
            />
          </ActionButton>

          <ActionButton
            label="댓글"
            onClick={() => setCommentsOpen(true)}
            count={shot.comments.length}
          >
            <MessageCircle className="size-6" strokeWidth={1.75} />
          </ActionButton>

          <ActionButton
            label="공유"
            onClick={() => setShareOpen(true)}
            count={shot.shareCount}
          >
            <Send className="size-6" strokeWidth={1.75} />
          </ActionButton>
        </div>

        <ActionButton
          label={scrapped ? "스크랩 해제" : "스크랩"}
          onClick={handleScrap}
        >
          <Bookmark
            className={cn(
              "size-6 transition-colors",
              scrapped && "fill-primary text-primary",
            )}
            strokeWidth={1.75}
          />
        </ActionButton>
      </div>

      <div className="px-4 pt-1 sm:px-5 md:px-6 lg:px-8">
        {body ? (
          <div>
            <p
              ref={bodyRef}
              className={cn(
                "text-[14px] leading-relaxed whitespace-pre-wrap text-foreground",
                !expanded && "line-clamp-2",
              )}
            >
              {body}
            </p>
            {needsClamp || expanded ? (
              <button
                type="button"
                className="mt-0.5 text-[14px] text-muted-foreground"
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? "간단 보기" : "더보기"}
              </button>
            ) : null}
          </div>
        ) : null}
        <p
          className={cn(
            "text-[12px] text-muted-foreground",
            body ? "mt-1.5" : undefined,
          )}
        >
          {formatFeedDate(shot.createdAt)}
        </p>
      </div>

      <ShoppingListSheet
        open={shoppingOpen}
        onOpenChange={setShoppingOpen}
        nickname={shot.authorNickname}
        shotId={shot.id}
        shotAuthorId={shot.authorId}
        destinationCity={shot.destinationCity}
      />
      <CommentsSheet
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        shotId={shot.id}
        shotAuthorId={shot.authorId}
        comments={shot.comments}
      />
      <ShareSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        shotId={shot.id}
        nickname={shot.authorNickname}
        onShared={handleShared}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="피드를 삭제할까요?"
        description="삭제한 피드는 되돌릴 수 없습니다."
        confirmLabel="삭제"
        loading={deleteShot.isPending}
        onConfirm={handleDelete}
      />
    </article>
  );
}

function ActionButton({
  children,
  label,
  count,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-foreground"
    >
      {children}
      {typeof count === "number" && count > 0 ? (
        <span className="text-[13px] font-semibold tabular-nums">
          {formatCount(count)}
        </span>
      ) : null}
    </button>
  );
}
