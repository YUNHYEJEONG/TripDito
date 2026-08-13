"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Database, Heart, Settings, Star, Ticket } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileCollectionBoard } from "@/features/profile/components/profile-collection-board";
import { ProfileIdentityCard } from "@/features/profile/components/profile-identity-card";
import { ProfileMenuLink } from "@/features/profile/components/profile-menu-link";
import { PassportHistory } from "@/features/profile/components/passport-history";
import { hasNickname } from "@/features/profile/constants";
import {
  useLocalProfile,
  useUpdateLocalProfile,
} from "@/features/profile/hooks/use-local-profile";
import { useReceivedCoupons } from "@/features/coupons/hooks/use-received-coupons";
import { compressImageFile } from "@/features/image-upload/utils/compress-image";
import { useScraps } from "@/features/shots/hooks/use-scraps";
import { useShots } from "@/features/shots/hooks/use-shots";
import { useTrips } from "@/features/trips/hooks/use-trips";
import { useAuthSession } from "@/features/auth/hooks/use-auth";
import { useFavoritedItems } from "@/features/shopping-items/hooks/use-items";
import {
  GUEST_AVATAR_INITIAL,
  GUEST_NICKNAME,
} from "@/features/auth/lib/guest-avatar";
import { getLoginMethodLabel } from "@/features/auth/lib/login-method-label";
import { getSafeReturnTo } from "@/lib/navigation/return-to";
import { useUnsavedChanges } from "@/lib/navigation/unsaved-changes";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedReturnTo = searchParams.get("returnTo");
  const returnTo = requestedReturnTo
    ? getSafeReturnTo(requestedReturnTo, "/profile")
    : null;
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: profile, isLoading: profileLoading } = useLocalProfile();
  const { data: trips = [], isLoading: tripsLoading } = useTrips();
  const { data: shots = [], isLoading: shotsLoading } = useShots();
  const { data: scraps = [], isLoading: scrapsLoading } = useScraps();
  const { data: receivedCoupons = [], isLoading: couponsLoading } =
    useReceivedCoupons();
  const { data: authSession, isLoading: authLoading } = useAuthSession();
  const { data: favoritedItems = [], isLoading: favoritesLoading } =
    useFavoritedItems();
  const isLoggedIn = Boolean(authSession?.isLoggedIn);
  const updateProfile = useUpdateLocalProfile();
  const [nickname, setNickname] = useState("");
  const [editing, setEditing] = useState(Boolean(requestedReturnTo));
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const storedNickname = profile?.nickname.trim() ?? "";
  const nicknameDirty = editing && nickname.trim() !== storedNickname;
  const requestNicknameDiscard = useUnsavedChanges(nicknameDirty);

  if (profileLoading || authLoading || !profile) {
    return (
      <AppShell withBottomNav>
        <main>
          <h1 className="sr-only">프로필</h1>
          <p
            className="py-10 text-center text-[13px] text-ink-2"
            role="status"
          >
            프로필을 불러오는 중…
          </p>
        </main>
      </AppShell>
    );
  }

  const profileNickname = storedNickname;
  const hasProfileNickname = hasNickname(profile);
  const displayName = isLoggedIn
    ? hasProfileNickname
      ? profileNickname
      : "닉네임을 등록해 주세요"
    : GUEST_NICKNAME;
  const ownShots = shots.filter(
    (shot) => shot.channel === "shots" && shot.authorId === profile.id,
  );
  const likedCount = shots.reduce(
    (count, shot) => count + (shot.likedByMe ? 1 : 0),
    0,
  );
  const shotById = new Map(shots.map((shot) => [shot.id, shot]));
  const scrappedShots = scraps.flatMap((scrap) => {
    const shot = shotById.get(scrap.shotId);
    return shot ? [shot] : [];
  });
  const loginMethodLabel = getLoginMethodLabel(authSession?.provider);

  async function handleSaveNickname() {
    const nextNickname = nickname.trim();
    if (!nextNickname) {
      toast.error("닉네임을 입력해 주세요");
      return;
    }

    try {
      await updateProfile.mutateAsync({ nickname: nextNickname });
      setEditing(false);
      if (returnTo) router.replace(returnTo);
    } catch {
      toast.error("닉네임을 저장하지 못했어요. 다시 시도해 주세요");
    }
  }

  async function handleAvatarChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일을 선택해 주세요");
      return;
    }

    setUploadingAvatar(true);
    try {
      const compressed = await compressImageFile(file);
      await updateProfile.mutateAsync({ avatarDataUrl: compressed.dataUrl });
    } catch {
      toast.error("사진을 변경하지 못했어요. 다른 이미지를 선택해 주세요");
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleEditToggle() {
    if (editing) {
      requestNicknameDiscard(() => {
        setNickname(profileNickname);
        setEditing(false);
      });
      return;
    }
    setNickname(profileNickname);
    setEditing(true);
  }

  return (
    <AppShell withBottomNav>
      <main className="mx-auto flex w-full max-w-[480px] flex-col gap-8 pt-1">
        <h1 className="sr-only">프로필</h1>

        <ProfileIdentityCard
          displayName={displayName}
          summary={
            tripsLoading || shotsLoading
              ? "여행 기록을 불러오는 중"
              : `여행 ${trips.length}번 · 내 때샷 ${ownShots.length}개`
          }
          detail={
            isLoggedIn
              ? loginMethodLabel
              : "로그인하면 프로필과 여행 기록을 이어서 관리할 수 있어요"
          }
          avatarSrc={isLoggedIn ? profile.avatarDataUrl : null}
          avatarInitial={GUEST_AVATAR_INITIAL}
          isLoggedIn={isLoggedIn}
          isEditing={editing}
          nickname={nickname}
          isSaving={updateProfile.isPending}
          isUploadingAvatar={uploadingAvatar}
          fileInputRef={fileRef}
          onNicknameChange={setNickname}
          onEditToggle={handleEditToggle}
          onSaveNickname={() => void handleSaveNickname()}
          onAvatarSelect={(files) => void handleAvatarChange(files)}
        />

        {tripsLoading ? (
          <section aria-label="여행 기록 불러오는 중" aria-busy="true">
            <h2 className="mb-3 text-[18px] font-bold tracking-[-0.02em] text-foreground">
              여행 기록
            </h2>
            <div className="flex min-h-28 items-center justify-center rounded-2xl border border-rule bg-secondary px-4 text-center">
              <p className="text-[13px] text-ink-2" role="status">
                여행 기록을 불러오는 중…
              </p>
            </div>
          </section>
        ) : (
          <PassportHistory trips={trips} />
        )}

        <section aria-labelledby="profile-collections-title">
          <h2
            id="profile-collections-title"
            className="mb-3 text-[18px] font-semibold tracking-[-0.02em] text-foreground"
          >
            컬렉션
          </h2>
          {shotsLoading || scrapsLoading ? (
            <div
              className="flex min-h-28 items-center justify-center rounded-xl border border-rule bg-secondary px-4 text-center"
              aria-label="컬렉션 불러오는 중"
              aria-busy="true"
            >
              <p className="text-[13px] text-ink-2" role="status">
                컬렉션을 불러오는 중…
              </p>
            </div>
          ) : (
            <div className="-mx-1 grid grid-cols-2 gap-3">
              <ProfileCollectionBoard
                href="/profile/shots"
                label="내 때샷"
                count={ownShots.length}
                imageSources={ownShots.flatMap((shot) =>
                  shot.images.slice(0, 1),
                )}
                kind="shots"
                preloadImage
              />
              <ProfileCollectionBoard
                href="/profile/scraps"
                label="스크랩"
                count={scrappedShots.length}
                imageSources={scrappedShots.flatMap((shot) =>
                  shot.images.slice(0, 1),
                )}
                kind="scraps"
              />
            </div>
          )}
        </section>

        <nav
          aria-label="프로필 메뉴"
          className="divide-y divide-border border-y border-border"
        >
          <ProfileMenuLink
            href="/profile/favorites"
            icon={Star}
            title="즐겨찾기한 상품"
            description={
              favoritesLoading ? "불러오는 중" : `${favoritedItems.length}개`
            }
          />
          <ProfileMenuLink
            href="/profile/likes"
            icon={Heart}
            title="좋아요"
            description={shotsLoading ? "불러오는 중" : `${likedCount}개`}
          />
          <ProfileMenuLink
            href="/profile/coupons"
            icon={Ticket}
            title="쿠폰"
            description={
              couponsLoading ? "불러오는 중" : `${receivedCoupons.length}장 보유`
            }
          />
          <ProfileMenuLink
            href="/profile/data"
            icon={Database}
            title="데이터 관리"
            description="저장 공간 · 데모 데이터 · 초기화"
          />
          <ProfileMenuLink
            href="/profile/settings"
            icon={Settings}
            title="설정"
            description={
              isLoggedIn ? "계정 · 알림 · 로그아웃" : "계정 · 알림"
            }
          />
        </nav>
      </main>
    </AppShell>
  );
}
