import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  backHref,
  actions,
  className,
}: {
  title: string;
  description?: string;
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 -mx-4 mb-6 flex items-start gap-3 border-b border-border/60 bg-canvas/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6",
        className,
      )}
    >
      {backHref ? (
        <Link
          href={backHref}
          aria-label="뒤로"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "mt-0.5 shrink-0",
          )}
        >
          <ArrowLeft />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
