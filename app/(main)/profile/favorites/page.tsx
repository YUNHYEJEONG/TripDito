"use client";

import Link from "next/link";
import { Package, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { CurrencyText } from "@/components/common/currency-text";
import { useFavoritedItems } from "@/features/shopping-items/hooks/use-items";
import { lineTotal } from "@/features/budget/utils/calculate-budget";
import { useTrips } from "@/features/trips/hooks/use-trips";

export default function ProfileFavoritesPage() {
  const { data: favorites = [], isLoading } = useFavoritedItems();
  const { data: trips = [], isLoading: tripsLoading } = useTrips();
  const tripMap = new Map(trips.map((trip) => [trip.id, trip]));

  return (
    <AppShell withBottomNav>
      <PageHeader title="즐겨찾기한 상품" backHref="/profile" />

      <main className="mx-auto w-full max-w-[480px]">
        {isLoading || tripsLoading ? (
          <p
            className="py-10 text-center text-[13px] text-ink-2"
            role="status"
          >
            즐겨찾기를 불러오는 중…
          </p>
        ) : favorites.length === 0 ? (
          <EmptyState
            title="즐겨찾기한 상품이 없어요"
            description="완료된 여행의 쇼핑리스트에서 별을 누르면 다시 사고 싶은 상품이 이곳에 모여요."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-rule border-y border-rule">
            {favorites.map((item) => {
              const trip = tripMap.get(item.tripId);
              return (
                <li key={item.id}>
                  <Link
                    href={`/trips/${item.tripId}`}
                    className="flex min-h-20 items-center gap-3 rounded-lg px-2 py-3 outline-none transition-colors hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-paper-2">
                      {item.imageDataUrl ? (
                        // User-created data URL, dimensions are not stable.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageDataUrl}
                          alt={`${item.name} 사진`}
                          className="size-full object-cover"
                        />
                      ) : (
                        <Package className="size-5 text-ink-3" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-ink">
                        {item.name}
                      </p>
                      {item.localName ? (
                        <p className="mt-0.5 truncate text-[12px] text-ink-2">
                          {item.localName}
                        </p>
                      ) : null}
                      <p className="mt-1 truncate text-[12px] text-ink-2">
                        {trip ? `${trip.city} · ` : "여행 정보 없음 · "}
                        {trip ? (
                          <CurrencyText
                            amount={lineTotal(item)}
                            currency={trip.currency}
                          />
                        ) : (
                          <span>금액 확인 필요</span>
                        )}
                      </p>
                    </div>
                    <Star
                      className="size-5 shrink-0 fill-star text-star"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
