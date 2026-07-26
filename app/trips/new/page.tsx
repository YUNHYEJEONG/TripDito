"use client";

import { AppShell } from "@/components/layout/app-shell";
import { NewTripWizard } from "@/features/trips/components/new-trip-wizard";

export default function NewTripPage() {
  return (
    <AppShell className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <NewTripWizard />
    </AppShell>
  );
}
