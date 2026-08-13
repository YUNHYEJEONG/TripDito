import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/layout/route-loading";

export const metadata: Metadata = { title: "회원가입" };

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={<RouteLoading label="회원가입 화면을 여는 중…" />}
    >
      {children}
    </Suspense>
  );
}
