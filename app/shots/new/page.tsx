"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import {
  PageHeader,
  HeaderCancelButton,
} from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { ShotUploadForm } from "@/features/shots/components/shot-upload-form";
import { useCreateShot } from "@/features/shots/hooks/use-shots";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";
import { useTrips } from "@/features/trips/hooks/use-trips";
import { hasNickname } from "@/features/profile/constants";
import { useLocalProfile } from "@/features/profile/hooks/use-local-profile";
import { requestPageNavigation } from "@/lib/navigation/unsaved-changes";
import { withReturnTo } from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";

export default function NewShotPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createShot = useCreateShot();
  const { isLoggedIn, isLoading } = useIsLoggedIn();
  const { data: trips = [], isLoading: tripsLoading } = useTrips();
  const { data: profile, isLoading: profileLoading } = useLocalProfile();
  const requestedTripId = searchParams.get("tripId") ?? "";
  const initialChannel =
    searchParams.get("channel") === "community" ? "community" : "shots";
  const initialTripId = trips.some((trip) => trip.id === requestedTripId)
    ? requestedTripId
    : "";
  const query = searchParams.toString();
  const currentHref = `/shots/new${query ? `?${query}` : ""}`;
  const feedHref =
    initialChannel === "community" ? "/shots?tab=community" : "/shots";

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace(`/login?returnTo=${encodeURIComponent(currentHref)}`);
    }
  }, [currentHref, isLoading, isLoggedIn, router]);

  if (
    isLoading ||
    tripsLoading ||
    profileLoading ||
    !profile ||
    !isLoggedIn
  ) {
    return (
      <AppShell>
        <p className="py-16 text-center text-[13px] text-muted-foreground">
          불러오는 중…
        </p>
      </AppShell>
    );
  }

  const prerequisite = !hasNickname(profile)
    ? {
        title: "닉네임을 먼저 등록해 주세요",
        description:
          "게시물에는 작성자 닉네임이 함께 표시돼요. 프로필에서 닉네임을 등록한 뒤 올려 주세요.",
        href: withReturnTo("/profile", currentHref),
        action: "닉네임 등록하기",
      }
    : trips.length === 0
      ? {
          title: "여행을 먼저 만들어 주세요",
          description:
            "게시물은 여행에 연결해 저장해요. 새 여행을 만든 뒤 사진과 여행 이야기를 남길 수 있어요.",
          href: withReturnTo("/trips/new", currentHref),
          action: "새 여행 만들기",
        }
      : null;

  return (
    <AppShell className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <PageHeader
        title="게시물 올리기"
        className="mb-3"
        actions={
          <HeaderCancelButton
            onClick={() => requestPageNavigation(() => router.push(feedHref))}
          />
        }
      />
      {prerequisite ? (
        <section className="rounded-xl bg-paper-2 px-4 py-5">
          <h2 className="text-[18px] leading-[1.45] font-semibold text-ink">
            {prerequisite.title}
          </h2>
          <p className="mt-2 text-[13px] leading-5 text-ink-2">
            {prerequisite.description}
          </p>
        </section>
      ) : (
        <ShotUploadForm
          formId="shot-upload-form"
          defaultValues={{ tripId: initialTripId, channel: initialChannel }}
          onSubmit={async (values) => {
            try {
              await createShot.mutateAsync(values);
              router.push(
                values.channel === "community"
                  ? "/shots?tab=community"
                  : "/shots",
              );
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "게시물을 저장하지 못했어요. 다시 시도해 주세요.";
              toast.error(message);
            }
          }}
        />
      )}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[var(--app-rail-max)] border-t border-rule bg-paper px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] min-[481px]:border-x">
        <div className="w-full">
          {prerequisite ? (
            <Link
              href={prerequisite.href}
              className={cn(buttonVariants(), "w-full")}
            >
              {prerequisite.action}
            </Link>
          ) : (
            <Button
              type="submit"
              form="shot-upload-form"
              className="w-full"
              disabled={createShot.isPending}
            >
              {createShot.isPending ? "게시하는 중…" : "게시하기"}
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
