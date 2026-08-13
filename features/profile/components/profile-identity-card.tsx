import Image from "next/image";
import Link from "next/link";
import type { RefObject } from "react";
import { Camera, Pencil, UserRound } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldActionRow } from "@/components/ui/field-action-row";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ProfileIdentityCardProps = {
  displayName: string;
  summary: string;
  detail?: string;
  avatarSrc: string | null;
  avatarInitial: string;
  isLoggedIn: boolean;
  isEditing: boolean;
  nickname: string;
  isSaving: boolean;
  isUploadingAvatar: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onNicknameChange: (value: string) => void;
  onEditToggle: () => void;
  onSaveNickname: () => void;
  onAvatarSelect: (files: FileList | null) => void;
};

export function ProfileIdentityCard({
  displayName,
  summary,
  detail,
  avatarSrc,
  avatarInitial,
  isLoggedIn,
  isEditing,
  nickname,
  isSaving,
  isUploadingAvatar,
  fileInputRef,
  onNicknameChange,
  onEditToggle,
  onSaveNickname,
  onAvatarSelect,
}: ProfileIdentityCardProps) {
  const avatar = (
    <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-foreground ring-1 ring-border">
      {avatarSrc ? (
        <Image
          src={avatarSrc}
          alt=""
          fill
          sizes="64px"
          unoptimized
          className="object-cover"
        />
      ) : isLoggedIn ? (
        <UserRound className="size-7" strokeWidth={1.8} aria-hidden />
      ) : (
        <span className="text-[21px] font-bold" aria-hidden>
          {avatarInitial}
        </span>
      )}
      {isLoggedIn ? (
        <span className="absolute right-0 bottom-0 flex size-6 items-center justify-center rounded-full border-2 border-background bg-foreground text-background">
          <Camera className="size-3" strokeWidth={1.9} aria-hidden />
        </span>
      ) : null}
    </span>
  );

  return (
    <section
      aria-labelledby="profile-identity-name"
      className="rounded-2xl border border-rule bg-background px-4 py-4"
    >
      <div className="grid grid-cols-[4rem_minmax(0,1fr)_2.75rem] items-center gap-3 min-[360px]:grid-cols-[4rem_minmax(0,1fr)_4.25rem]">
        {isLoggedIn ? (
          <button
            type="button"
            aria-label={
              isUploadingAvatar ? "프로필 사진 처리 중" : "프로필 사진 변경"
            }
            disabled={isUploadingAvatar || isSaving}
            className="shrink-0 rounded-full outline-none transition-shadow duration-120 hover:ring-2 hover:ring-rule active:ring-2 active:ring-ink focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatar}
          </button>
        ) : (
          avatar
        )}

        <div className="min-w-0">
          <h2
            id="profile-identity-name"
            className="break-keep text-[19px] leading-6 font-bold tracking-[-0.02em] text-foreground"
          >
            {displayName}
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-ink-2 tabular-nums">
            {summary}
          </p>
        </div>

        {isLoggedIn ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="size-11 px-0 min-[360px]:w-[68px] min-[360px]:px-3"
            aria-label={isEditing ? "프로필 수정 닫기" : "프로필 수정"}
            aria-expanded={isEditing}
            aria-controls="profile-edit-fields"
            disabled={isSaving || isUploadingAvatar}
            onClick={onEditToggle}
          >
            <Pencil className="size-4" strokeWidth={1.8} aria-hidden />
            <span className="hidden min-[360px]:inline">
              {isEditing ? "닫기" : "수정"}
            </span>
          </Button>
        ) : (
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "sm" }),
              "size-11 px-0 text-[12px] min-[360px]:w-[68px] min-[360px]:px-3",
            )}
            aria-label="로그인"
          >
            <span className="hidden min-[360px]:inline">로그인</span>
            <UserRound
              className="size-5 min-[360px]:hidden"
              strokeWidth={1.8}
              aria-hidden
            />
          </Link>
        )}
      </div>

      {detail ? (
        <p className="mt-3 border-t border-border pt-3 text-[12px] leading-5 text-ink-2">
          {detail}
        </p>
      ) : null}

      {isLoggedIn ? (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => onAvatarSelect(event.target.files)}
        />
      ) : null}

      {isLoggedIn && isEditing ? (
        <div
          id="profile-edit-fields"
          className="mt-5 border-t border-border pt-4"
        >
          <Label htmlFor="profile-nickname">닉네임</Label>
          <FieldActionRow className="mt-2">
            <Input
              id="profile-nickname"
              variant="field"
              value={nickname}
              maxLength={20}
              autoComplete="nickname"
              placeholder="닉네임을 입력해 주세요"
              className="min-w-0 flex-1"
              disabled={isSaving}
              onChange={(event) => onNicknameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.nativeEvent.isComposing) {
                  return;
                }
                event.preventDefault();
                onSaveNickname();
              }}
            />
            <Button
              type="button"
              size="fieldAction"
              className="shrink-0"
              onClick={onSaveNickname}
              disabled={isSaving}
            >
              {isSaving ? "저장 중" : "저장"}
            </Button>
          </FieldActionRow>
        </div>
      ) : null}
    </section>
  );
}
