"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { HeaderNavActions } from "@/components/layout/header-nav-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GrayCard,
  GrayCardDescription,
  GrayCardTitle,
} from "@/components/ui/gray-card";
import {
  useLocalProfile,
  useUpdateLocalProfile,
} from "@/features/profile/hooks/use-local-profile";
import { useScraps } from "@/features/shots/hooks/use-scraps";

export default function ProfilePage() {
  const { data: profile, isLoading } = useLocalProfile();
  const updateProfile = useUpdateLocalProfile();
  const { data: scraps = [] } = useScraps();
  const [nickname, setNickname] = useState("");
  const [editing, setEditing] = useState(false);

  const displayName = profile?.nickname ?? "나";

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

  return (
    <AppShell withBottomNav>
      <PageHeader
        title="프로필"
        actions={<HeaderNavActions />}
      />

      {isLoading || !profile ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          불러오는 중…
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <GrayCard>
            <div className="flex items-center gap-3">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background text-[18px] font-bold text-[#4E5968]">
                {profile.avatarDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarDataUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  displayName.slice(0, 1)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <GrayCardTitle className="text-[18px]">
                  {displayName}
                </GrayCardTitle>
                <GrayCardDescription className="mt-0.5">
                  로컬 프로필 · 로그인 없이 사용 중
                </GrayCardDescription>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setNickname(displayName);
                  setEditing((v) => !v);
                }}
              >
                {editing ? "닫기" : "수정"}
              </Button>
            </div>

            {editing ? (
              <div className="mt-4 flex flex-col gap-2">
                <Label htmlFor="nickname">닉네임</Label>
                <div className="flex gap-2">
                  <Input
                    id="nickname"
                    value={nickname}
                    maxLength={20}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={() => void handleSaveNickname()}
                    disabled={updateProfile.isPending}
                  >
                    저장
                  </Button>
                </div>
              </div>
            ) : null}
          </GrayCard>

          <Link
            href="/profile/scraps"
            className="flex items-center gap-3 rounded-2xl border border-[#EAEDED] bg-background px-4 py-3.5 transition-colors hover:bg-[#F8F9FA]"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#F2F4F6]">
              <Bookmark className="size-5 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">스크랩한 때샷</p>
              <p className="text-[12px] text-muted-foreground">
                {scraps.length}개 저장됨
              </p>
            </div>
            <ChevronRight className="size-5 text-[#848C94]" />
          </Link>
        </div>
      )}
    </AppShell>
  );
}
