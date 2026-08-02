"use client";

import Link from "next/link";
import { Package, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { useFavoritedItems } from "@/features/shopping-items/hooks/use-items";
import { useTrips } from "@/features/trips/hooks/use-trips";
import { useMemo } from "react";

export default function ProfileFavoritesPage() {
  const { data: favorites = [], isLoading } = useFavoritedItems();
  const { data: trips = [] } = useTrips();

  const rows = useMemo(() => {
    const tripMap = new Map(trips.map((trip) => [trip.id, trip]));
    return favorites.map((item) => ({
      item,
      trip: tripMap.get(item.tripId),
    }));
  }, [favorites, trips]);

  return (
    <AppShell withBottomNav>
      <PageHeader title="즐겨찾기한 상품" backHref="/profile" />

      {isLoading ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          불러오는 중…
        </p>
      ) : rows.length === 0 ? (
        <EmptyState
          title="즐겨찾기한 상품이 없어요"
          description="종료된 여행의 쇼핑리스트에서 하트를 누르면 여기에 모아요."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map(({ item, trip }) => (
            <li key={item.id}>
              <Link
                href={`/trips/${item.tripId}`}
                className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background px-3 py-3"
              >
                <div className="bg-muted flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                  {item.imageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageDataUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <Package className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-foreground">
                    {item.name}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {trip
                      ? `${trip.city}, ${trip.country}`
                      : "여행 정보 없음"}
                  </p>
                </div>
                <Star className="size-4 shrink-0 fill-primary text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
