import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/layout/route-loading";

export const metadata: Metadata = { title: "쇼핑" };

export default function ShoppingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={<RouteLoading label="쇼핑을 여는 중…" surface="feed" withBottomNav />}
    >
      {children}
    </Suspense>
  );
}
