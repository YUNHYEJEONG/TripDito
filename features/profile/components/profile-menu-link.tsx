import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProfileMenuLink({
  href,
  icon: Icon,
  title,
  description,
  className,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-16 items-center gap-3 px-3 py-3 outline-none hover:bg-secondary/60 active:bg-secondary focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center text-foreground">
        <Icon className="size-5" strokeWidth={1.8} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-5 text-foreground">
          {title}
        </span>
        <span className="mt-1 block text-[12px] leading-[1.4] text-ink-2 tabular-nums">
          {description}
        </span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-ink-3"
        strokeWidth={1.8}
        aria-hidden
      />
    </Link>
  );
}
