"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
        <h1 className="text-xl font-semibold">문제가 발생했어요</h1>
        <p className="text-sm text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
        <Button className="mt-2" onClick={reset}>
          다시 시도
        </Button>
      </div>
    </AppShell>
  );
}
