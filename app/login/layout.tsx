import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/layout/route-loading";

export const metadata: Metadata = { title: "로그인" };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={<RouteLoading label="로그인 화면을 여는 중…" />}
    >
      {children}
    </Suspense>
  );
}
