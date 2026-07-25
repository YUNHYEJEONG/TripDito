import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

export function ProfileMenuLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-[#EAEDED] bg-background px-4 py-3.5 transition-colors hover:bg-[#F8F9FA]"
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-[#F2F4F6]">
        <Icon className="size-5 text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">{title}</p>
        <p className="text-[12px] text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="size-5 text-[#848C94]" />
    </Link>
  );
}
