"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, Camera, Heart, Ticket } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  LoadingRegion,
  ProfileSkeleton,
} from "@/components/common/loading-skeletons";
import { HeaderNavActions } from "@/components/layout/header-nav-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldActionRow } from "@/components/ui/field-action-row";
import {
  GrayCard,
  GrayCardDescription,
  GrayCardTitle,
} from "@/components/ui/gray-card";
import {
  useLocalProfile,
  useUpdateLocalProfile,
} from "@/features/profile/hooks/use-local-profile";
import { hasNickname } from "@/features/profile/constants";
import { ProfileMenuLink } from "@/features/profile/components/profile-menu-link";
import { useScraps } from "@/features/shots/hooks/use-scraps";
import { useShots } from "@/features/shots/hooks/use-shots";
import { useReceivedCoupons } from "@/features/coupons/hooks/use-received-coupons";
import {
  compressImageFile,
  IMAGE_PRESETS,
} from "@/features/image-upload/utils/compress-image";
import { useIsLoggedIn, useLogout, useAuthSession } from "@/features/auth/hooks/use-auth";
import {
  GUEST_AVATAR_INITIAL,
  GUEST_NICKNAME,
} from "@/features/auth/lib/guest-avatar";
import { getLoginMethodLabel } from "@/features/auth/lib/login-method-label";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: profile, isLoading } = useLocalProfile();
  const updateProfile = useUpdateLocalProfile();
  const { data: scraps = [] } = useScraps();
  const { data: shots = [] } = useShots();
  const { data: receivedCoupons = [] } = useReceivedCoupons();
  const { data: authSession, isLoading: authLoading } = useAuthSession();
  const { isLoggedIn } = useIsLoggedIn();
  const logout = useLogout();
  const [nickname, setNickname] = useState("");
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const profileNickname = profile?.nickname.trim() ?? "";
  const hasProfileNickname = hasNickname(profile);
  const displayName = isLoggedIn
    ? hasProfileNickname
      ? profileNickname
      : "닉네임 미설정"
    : GUEST_NICKNAME;
  const avatarSrc = profile?.avatarDataUrl || null;
  const loginMethodLabel = getLoginMethodLabel(authSession?.provider);
  const likedCount = shots.filter((shot) => shot.likedByMe).length;

  async function handleSaveNickname() {
    const next = nickname.trim();
    if (!next) {
      toast.error("닉네임을 입력하세요");
      return;
    }
    try {
      await updateProfile.mutateAsync({ nickname: next });
      toast.success("닉네임을 저장했습니다");
      setEditing(false);
    } catch {
      toast.error("저장에 실패했습니다");
    }
  }

  async function handleAvatarChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 선택할 수 있어요");
      return;
    }

    setUploadingAvatar(true);
    try {
      const compressed = await compressImageFile(file, IMAGE_PRESETS.avatar);
      await updateProfile.mutateAsync({
        avatarDataUrl: compressed.dataUrl,
      });
      toast.success("프로필 사진을 변경했습니다");
    } catch {
      toast.error("프로필 사진 변경에 실패했습니다");
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      setEditing(false);
      toast.success("로그아웃되었습니다");
    } catch {
      toast.error("로그아웃에 실패했습니다");
    }
  }

  return (
    <AppShell withBottomNav>
      <PageHeader title="프로필" actions={<HeaderNavActions />} />

      {isLoading || authLoading || !profile ? (
        <LoadingRegion>
          <ProfileSkeleton />
        </LoadingRegion>
      ) : (
        <div className="flex flex-col gap-4">
          <GrayCard>
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {isLoggedIn ? (
                  <>
                    <button
                      type="button"
                      aria-label="프로필 사진 변경"
                      disabled={uploadingAvatar || updateProfile.isPending}
                      className="relative flex size-12 items-center justify-center overflow-hidden rounded-full bg-[#F2F4F6] text-[#848C94] ring-1 ring-border/80 transition-opacity disabled:opacity-60"
                      onClick={() => fileRef.current?.click()}
                    >
                      {avatarSrc ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={avatarSrc}
                            alt=""
                            className="size-full object-cover"
                          />
                          <span className="absolute inset-x-0 bottom-0 flex h-5 items-center justify-center bg-black/45">
                            <Camera className="size-3 text-white" aria-hidden />
                          </span>
                        </>
                      ) : (
                        <Camera className="size-5" aria-hidden />
                      )}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        void handleAvatarChange(event.target.files)
                      }
                    />
                  </>
                ) : (
                  <div
                    aria-hidden
                    className="flex size-12 items-center justify-center rounded-full bg-primary text-[18px] font-bold text-primary-foreground"
                  >
                    {GUEST_AVATAR_INITIAL}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <GrayCardTitle
                  className={cn(
                    "text-[18px]",
                    isLoggedIn && !hasProfileNickname && "text-muted-foreground",
                  )}
                >
                  {displayName}
                </GrayCardTitle>
                {isLoggedIn ? (
                  <GrayCardDescription className="mt-0.5">
                    {loginMethodLabel}
                  </GrayCardDescription>
                ) : null}
              </div>
              {!isLoggedIn ? (
                <Link
                  href="/login"
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  로그인 하기
                </Link>
              ) : null}
            </div>

            {isLoggedIn && editing ? (
              <div className="mt-4 flex flex-col gap-2">
                <Label htmlFor="nickname">닉네임</Label>
                <FieldActionRow>
                  <Input
                    id="nickname"
                    variant="field"
                    value={nickname}
                    maxLength={20}
                    placeholder="닉네임을 입력하세요"
                    className="min-w-0 flex-1"
                    onChange={(e) => setNickname(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="fieldAction"
                    className="shrink-0"
                    onClick={() => void handleSaveNickname()}
                    disabled={updateProfile.isPending}
                  >
                    저장
                  </Button>
                </FieldActionRow>
              </div>
            ) : null}

            {isLoggedIn ? (
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setNickname(profileNickname);
                    setEditing((v) => !v);
                  }}
                >
                  {editing ? "취소" : "닉네임 수정"}
                </Button>
              </div>
            ) : null}
          </GrayCard>

          <div className="flex flex-col gap-2">
            <ProfileMenuLink
              href="/profile/coupons"
              icon={Ticket}
              title="내가 받은 쿠폰"
              description={`${receivedCoupons.length}장 보유`}
            />
            <ProfileMenuLink
              href="/profile/likes"
              icon={Heart}
              title="좋아요 누른 피드"
              description={`${likedCount}개`}
            />
            <ProfileMenuLink
              href="/profile/scraps"
              icon={Bookmark}
              title="스크랩한 때샷"
              description={`${scraps.length}개 저장됨`}
            />
          </div>

          {isLoggedIn ? (
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full"
              onClick={() => void handleLogout()}
              disabled={logout.isPending}
            >
              로그아웃
            </Button>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
