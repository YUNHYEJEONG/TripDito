"use client";

import { Button } from "@/components/ui/button";

export function FormPageStatus({
  title,
  description,
  actionLabel,
  onAction,
  loading = false,
  announce,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
  announce?: "polite" | "assertive";
}) {
  return (
    <section
      className="mx-auto flex min-h-[52vh] w-full max-w-md flex-col items-center justify-center gap-3 text-center"
      aria-busy={loading || undefined}
      aria-live={loading ? "polite" : announce}
      role={loading ? "status" : announce === "assertive" ? "alert" : undefined}
    >
      <h2 className="text-[22px] leading-[1.35] font-bold tracking-[-0.02em] text-ink">
        {title}
      </h2>
      <p className="max-w-sm text-[15px] leading-6 text-ink-2">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button className="mt-2 min-w-40" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
}
