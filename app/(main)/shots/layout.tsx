import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: "때샷" };

export default function ShotsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <AppShell withBottomNav>
          <main>
            <h1 className="sr-only">때샷</h1>
            <p
              className="py-10 text-center text-[13px] text-ink-2"
              role="status"
            >
              때샷을 불러오는 중…
            </p>
          </main>
        </AppShell>
      }
    >
      {children}
    </Suspense>
  );
}
