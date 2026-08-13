"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { bootstrapDemoData } from "../bootstrap";
import { createAccountScopedStorage } from "@/lib/storage/local-storage";

/**
 * The only automatic integration point for the removable demo data layer.
 *
 * Preview data must be opt-in. A production visitor with an empty browser is a
 * real empty-state user, not a demo account, so only explicit preview builds
 * are allowed to seed automatically.
 */
export function DemoDataBootstrap() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA !== "true") return;
    const result = bootstrapDemoData(
      createAccountScopedStorage(window.localStorage),
    );
    if (result.status === "seeded") {
      void queryClient.invalidateQueries();
    }
  }, [queryClient]);

  return null;
}
