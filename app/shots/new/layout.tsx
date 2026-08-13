import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/layout/route-loading";

export const metadata: Metadata = { title: "때샷 올리기" };

export default function NewShotLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={<RouteLoading label="작성 화면을 여는 중…" surface="feed" />}
    >
      {children}
    </Suspense>
  );
}
