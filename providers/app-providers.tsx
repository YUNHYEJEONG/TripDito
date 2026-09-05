"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { AnalysisJobBanner } from "@/features/image-analysis/components/analysis-job-banner";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <QueryProvider>
          {children}
          <AnalysisJobBanner />
          <Toaster />
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
