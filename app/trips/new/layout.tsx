import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/layout/route-loading";

export const metadata: Metadata = { title: "새 여행" };

export default function NewTripLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={<RouteLoading label="여행 만들기를 여는 중…" />}
    >
      {children}
    </Suspense>
  );
}
