import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { GoogleMapExplorer } from "@/features/map/components/google-map-explorer";
import { DemoMapExplorer } from "@/features/map/components/demo-map-explorer";
import { getSafeReturnTo } from "@/lib/navigation/return-to";

export const metadata: Metadata = { title: "지도" };

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    placeId?: string | string[];
    returnTo?: string | string[];
  }>;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const params = await searchParams;
  const initialQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const initialPlaceId = Array.isArray(params.placeId)
    ? params.placeId[0]
    : params.placeId;
  const returnTo = getSafeReturnTo(params.returnTo);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[var(--app-planning-max)] flex-col overflow-hidden bg-paper">
      <div className="w-full shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <PageHeader
          title="지도"
          backHref={returnTo}
          sticky={false}
          className="mb-0"
        />
      </div>

      <div className="relative min-h-0 w-full flex-1">
        {apiKey ? (
          <GoogleMapExplorer
            apiKey={apiKey}
            initialQuery={initialQuery ?? ""}
            initialPlaceId={initialPlaceId ?? ""}
          />
        ) : (
          <DemoMapExplorer initialQuery={initialQuery ?? ""} />
        )}
      </div>
    </div>
  );
}
