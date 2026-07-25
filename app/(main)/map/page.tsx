"use client";

import { PageHeader } from "@/components/layout/page-header";
import { HeaderNavActions } from "@/components/layout/header-nav-actions";
import { GoogleMapExplorer } from "@/features/map/components/google-map-explorer";

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <div className="flex h-dvh w-full min-w-[320px] flex-col overflow-hidden">
      <div className="mx-auto w-full max-w-[480px] shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 md:max-w-[720px] md:px-6 lg:max-w-[960px] lg:px-8">
        <PageHeader
          title="지도"
          actions={<HeaderNavActions />}
          className="mb-0"
        />
      </div>

      <div className="relative min-h-0 w-full flex-1">
        <GoogleMapExplorer apiKey={apiKey} />
      </div>

      {/* 고정 하단 네비 높이 확보 */}
      <div
        className="shrink-0"
        style={{ height: "calc(3.5rem + env(safe-area-inset-bottom, 0px))" }}
        aria-hidden
      />
    </div>
  );
}
