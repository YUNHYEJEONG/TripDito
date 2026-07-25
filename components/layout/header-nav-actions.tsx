"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPinned, Menu, Plus, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BrandLogo } from "@/components/brand/brand-logo";
import { headerIconButtonClassName } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/map", label: "지도", icon: MapPinned },
  { href: "/trips/new", label: "새 여행", icon: Plus },
] as const;

export function HeaderNavActions() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-9 items-center gap-0.5">
      <Link href="/map" aria-label="지도" className={headerIconButtonClassName}>
        <MapPinned />
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className={headerIconButtonClassName} aria-label="메뉴">
          <Menu />
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[min(20rem,85vw)] p-0"
          showCloseButton={false}
        >
          <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-border px-4 py-3.5 text-left">
            <SheetTitle className="sr-only">메뉴</SheetTitle>
            <BrandLogo variant="full" size="sm" href={null} />
            <button
              type="button"
              aria-label="닫기"
              className={headerIconButtonClassName}
              onClick={() => setOpen(false)}
            >
              <X />
            </button>
          </SheetHeader>
          <nav className="flex flex-col gap-0.5 p-3">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/home"
                  ? pathname === "/home" || pathname === "/"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-foreground hover:bg-secondary/70",
                  )}
                >
                  <Icon className="size-5 shrink-0 text-muted-foreground" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
