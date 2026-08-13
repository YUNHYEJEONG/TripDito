"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageUp, ListPlus, Plane } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { AddFromImagesSheet } from "@/features/image-upload/components/add-from-images-sheet";
import type { HomeMode } from "@/features/home/utils/get-home-mode";
import { cn } from "@/lib/utils";

const fabFocusClassName =
  "focus-visible:border-paper focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

function preventNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

export function HomeContextFab({
  mode,
  tripId,
  currency,
  disabled = false,
}: {
  mode: HomeMode;
  tripId?: string;
  currency?: string;
  disabled?: boolean;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);

  if (mode === "idle" || !tripId) {
    return (
      <FabDock>
        <Link
          href="/trips/new"
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
          onClick={disabled ? preventNavigation : undefined}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 rounded-full px-4 shadow-float hover:bg-accent-text aria-disabled:bg-accent aria-disabled:hover:bg-accent aria-disabled:active:translate-y-0",
            fabFocusClassName,
          )}
        >
          <Plane className="size-4 -rotate-45" aria-hidden />
          새 여행
        </Link>
      </FabDock>
    );
  }

  if (mode === "after") {
    return (
      <FabDock>
        <Link
          href={`/shots/new?tripId=${encodeURIComponent(tripId)}`}
          aria-label="때샷 올리기"
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
          onClick={disabled ? preventNavigation : undefined}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-14 rounded-full bg-after-deep px-5 text-paper shadow-float hover:bg-after-ink-2 active:bg-after-deep aria-disabled:bg-after-deep aria-disabled:hover:bg-after-deep aria-disabled:active:translate-y-0 aria-disabled:active:bg-after-deep",
            fabFocusClassName,
          )}
        >
          <ImageUp className="size-5" aria-hidden />
          <span>때샷 올리기</span>
        </Link>
      </FabDock>
    );
  }

  if (mode === "live") {
    return null;
  }

  return (
    <>
      <FabDock>
        <Button
          type="button"
          size="lg"
          aria-haspopup="dialog"
          aria-expanded={uploadOpen}
          aria-label="살 것 추가"
          disabled={disabled}
          className={cn(
            "h-14 rounded-full px-5 shadow-float disabled:shadow-none",
            fabFocusClassName,
            "bg-prep-deep text-paper hover:bg-accent-text active:bg-prep-deep disabled:bg-prep-deep disabled:text-paper disabled:hover:bg-prep-deep",
          )}
          onClick={() => setUploadOpen(true)}
        >
          <ListPlus className="size-5" aria-hidden />
          <span>살 것 추가</span>
        </Button>
      </FabDock>
      <AddFromImagesSheet
        tripId={tripId}
        currency={currency ?? "KRW"}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        intent={{ kind: "pretrip-candidates" }}
      />
    </>
  );
}

function FabDock({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tab-bar-height)+1rem+env(safe-area-inset-bottom))] z-30">
      <div className="mx-auto flex w-full max-w-[480px] justify-end px-4">
        <div className="pointer-events-auto">{children}</div>
      </div>
    </div>
  );
}
