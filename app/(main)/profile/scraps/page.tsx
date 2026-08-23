"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { useScraps } from "@/features/shots/hooks/use-scraps";
import { useRequireLogin } from "@/features/auth/hooks/use-require-login";

export default function ProfileScrapsPage() {
  useRequireLogin();
  const { data: scraps = [], isLoading: loading } = useScraps();

  const scrapedShots = useMemo(
    () => scraps.map((scrap) => ({ scrap, shot: scrap.shot })),
    [scraps],
  );

  return (
    <AppShell withBottomNav>
      <PageHeader title="스크랩한 때샷" backHref="/profile" />

      {loading ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          불러오는 중…
        </p>
      ) : scrapedShots.length === 0 ? (
        <EmptyState
          title="스크랩한 때샷이 없어요"
          description="피드에서 북마크를 누르면 여기에 쌓여요."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {scrapedShots.map(({ scrap, shot }) => (
            <Link
              key={scrap.id}
              href={`/shots#${shot.id}`}
              className="group relative aspect-square overflow-hidden rounded-xl bg-[#F2F4F6]"
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
