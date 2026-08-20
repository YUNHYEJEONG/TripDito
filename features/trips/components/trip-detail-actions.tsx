"use client";

import Link from "next/link";
import { useState } from "react";
import { Camera, ListPlus, Plus, Stamp } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHandle,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { withReturnTo } from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";

type TripDetailActionsProps = {
  tripId: string;
  completed: boolean;
  returnTo: string;
  passportHref: string;
  /** 이 여행 도장이 이미 여권에 찍혀 있는지. 찍는 것과 보는 것은 다른 일이다. */
  stamped?: boolean;
  onOpenPhoto: () => void;
};

export function TripDetailActions({
  tripId,
  completed,
  returnTo,
  passportHref,
  stamped = false,
  onOpenPhoto,
}: TripDetailActionsProps) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [photoQueued, setPhotoQueued] = useState(false);
  const directHref = withReturnTo(
    completed
      ? `/trips/${tripId}/items/new?intent=settlement`
      : `/trips/${tripId}/items/new`,
    returnTo,
  );

  function choosePhoto() {
    setPhotoQueued(true);
    setAddMenuOpen(false);
  }

  return (
    <footer className="relative z-30 -mx-[var(--app-gutter)] shrink-0 border-t border-rule bg-paper px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] min-[481px]:border-x">
      {completed ? (
        <div className="grid grid-cols-[minmax(0,1fr)_3rem] gap-2">
          <Link
            href={passportHref}
            className={cn(
              buttonVariants({ size: "lg" }),
              "min-w-0 bg-[var(--passport-cover)] px-3 text-paper hover:bg-[var(--passport-cover-hi)]",
            )}
          >
            <Stamp aria-hidden />
            {stamped ? "도장 보러가기" : "도장 찍으러 가기"}
          </Link>

          <Sheet
            open={addMenuOpen}
            onOpenChange={setAddMenuOpen}
            onOpenChangeComplete={(open) => {
              if (open || !photoQueued) return;

              setPhotoQueued(false);
              onOpenPhoto();
            }}
          >
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-lg"
                  aria-label="구매 기록 추가"
                />
              }
            >
              <Plus aria-hidden />
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHandle />
              <SheetHeader>
                <SheetTitle>구매 기록 추가</SheetTitle>
                <SheetDescription className="sr-only">
                  구매 기록 추가 방법을 선택하세요.
                </SheetDescription>
              </SheetHeader>
              <SheetBody className="grid gap-2 pb-5">
                <Link
                  href={directHref}
                  onClick={() => setAddMenuOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "surfaceOutline", size: "lg" }),
                    "w-full justify-start",
                  )}
                >
                  <ListPlus aria-hidden />
                  직접 추가
                </Link>
                <Button
                  type="button"
                  variant="surfaceOutline"
                  size="lg"
                  className="w-full justify-start"
                  onClick={choosePhoto}
                >
                  <Camera aria-hidden />
                  사진으로 추가
                </Button>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="flex gap-2">
          <Link
            href={directHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-w-0 flex-1 px-2",
            )}
          >
            <Plus aria-hidden />
            직접 추가
          </Link>
          <Button
            size="lg"
            className="min-w-0 flex-[1.25] px-2"
            onClick={onOpenPhoto}
          >
            <Camera aria-hidden />
            사진으로 추가
          </Button>
        </div>
      )}
    </footer>
  );
}
