"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  FeedSkeleton,
  LoadingRegion,
} from "@/components/common/loading-skeletons";
import { EmptyState } from "@/components/common/empty-state";
import { useLikedShots } from "@/features/shots/hooks/use-shots";
import { useRequireLogin } from "@/features/auth/hooks/use-require-login";

export default function ProfileLikesPage() {
  useRequireLogin();
  const { data: shots = [], isLoading } = useLikedShots();

  const likedShots = useMemo(
    () =>
      shots
        .filter((shot) => shot.likedByMe)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    [shots],
  );

  return (
    <AppShell withBottomNav>
      <PageHeader title="좋아요 누른 피드" backHref="/profile" />

      {isLoading ? (
        <LoadingRegion>
          <FeedSkeleton />
        </LoadingRegion>
      ) : likedShots.length === 0 ? (
        <EmptyState
          title="좋아요한 피드가 없어요"
          description="때샷에서 하트를 누르면 여기에 쌓여요."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {likedShots.map((shot) => (
            <Link
              key={shot.id}
              href={`/shots#${shot.id}`}
              className="group relative aspect-square overflow-hidden rounded-lg bg-[#F2F4F6]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shot.images[0]}
                alt=""
                className="size-full object-cover transition-transform group-hover:scale-[1.02]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 pt-6 pb-2">
                <p className="truncate text-[12px] font-semibold text-white">
                  {shot.authorNickname}
                </p>
                <p className="truncate text-[10px] text-white/80">
                  {shot.destinationCity}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
