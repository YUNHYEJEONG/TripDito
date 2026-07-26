"use client";

import Link from "next/link";
import { MapPinned } from "lucide-react";
import { headerIconButtonClassName } from "@/components/layout/page-header";

export function HeaderNavActions() {
  return (
    <div className="flex h-9 items-center gap-0.5">
      <Link href="/map" aria-label="지도" className={headerIconButtonClassName}>
        <MapPinned />
      </Link>
    </div>
  );
}
