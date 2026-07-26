"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  GrayCard,
  GrayCardDescription,
  GrayCardTitle,
} from "@/components/ui/gray-card";
import { cn } from "@/lib/utils";

export function HomeCreateTripCta() {
  return (
    <section>
      <GrayCard>
        <GrayCardTitle>새 여행 등록하기</GrayCardTitle>
        <GrayCardDescription>
          다가오는 여행이 없어요. 일정을 만들면 쇼핑리스트와 환율을 한눈에 볼 수
          있어요.
        </GrayCardDescription>
        <Link
          href="/trips/new"
          className={cn(buttonVariants({ size: "lg" }), "mt-1 w-full")}
        >
          <Plus />
          여행 만들기
        </Link>
      </GrayCard>
    </section>
  );
}
