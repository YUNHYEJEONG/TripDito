"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionBridge } from "@/features/auth/components/auth-session-bridge";
import { AnalysisJobRunner } from "@/features/image-analysis/components/analysis-job-runner";
import { CoupangCompareScanner } from "@/features/coupang-compare/components/coupang-compare-scanner";
import { TripEndedNotificationScanner } from "@/features/notifications/components/trip-ended-notification-scanner";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <QueryProvider>
          <AuthSessionBridge />
          <AnalysisJobRunner />
          <CoupangCompareScanner />
          <TripEndedNotificationScanner />
          {children}
          <Toaster />
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
