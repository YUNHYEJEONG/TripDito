import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/layout/route-loading";

export const metadata: Metadata = { title: "쇼핑리스트" };

export default function TripLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={<RouteLoading label="쇼핑리스트를 여는 중…" />}
    >
      {children}
    </Suspense>
  );
}
