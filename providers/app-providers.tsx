"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionBridge } from "@/features/auth/components/auth-session-bridge";
import { DemoDataBootstrap } from "@/features/demo/components/demo-data-bootstrap";
import { UnsavedNavigationProvider } from "@/providers/unsaved-navigation-provider";
import { AnalysisJobRunner } from "@/features/image-analysis/components/analysis-job-runner";
import { AnalysisJobStatusCenter } from "@/features/image-analysis/components/analysis-job-status-center";
import { CoupangCompareScanner } from "@/features/coupang-compare/components/coupang-compare-scanner";
import { TripEndedNotificationScanner } from "@/features/notifications/components/trip-ended-notification-scanner";
import { AccountScopeSync } from "@/features/auth/components/account-scope-sync";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <QueryProvider>
          <UnsavedNavigationProvider>
            <DemoDataBootstrap />
            <AccountScopeSync />
            <AuthSessionBridge />
            <AnalysisJobRunner />
            <CoupangCompareScanner />
            <TripEndedNotificationScanner />
            <AnalysisJobStatusCenter />
            {children}
            <Toaster />
          </UnsavedNavigationProvider>
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
