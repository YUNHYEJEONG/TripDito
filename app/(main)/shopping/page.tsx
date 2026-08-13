"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { HeaderNavActions } from "@/components/layout/header-nav-actions";
import { EmptyState } from "@/components/common/empty-state";
import { CouponSection } from "@/features/shopping/components/coupon-section";
import { MagazineList } from "@/features/shopping/components/magazine-list";
import { RecommendRail } from "@/features/shopping/components/recommend-rail";
import { ShoppingAdDialog } from "@/features/shopping/components/shopping-ad-dialog";
import { ShoppingDestinationFilter } from "@/features/shopping/components/shopping-destination-filter";
import { ShoppingSection } from "@/features/shopping/components/shopping-section";
import { ShotsChannelTabs } from "@/features/shots/components/shots-channel-tabs";
import {
  DEMO_MAGAZINES,
  DEMO_MALLS,
  DEMO_RESTAURANTS,
  DEMO_SHOPPING_AD,
  DEMO_TOURS,
  SHOPPING_DESTINATION_OPTIONS,
  type ShoppingDestination,
  type ShoppingMagazineItem,
  type ShoppingRecommendItem,
} from "@/features/shopping/data/demo-shopping-content";
import {
  filterMagazineItems,
  filterRecommendItems,
} from "@/features/shopping/lib/filter-shopping-content";
import { listCouponDestinations } from "@/features/coupons/lib/filter-coupons";
import { useTaxFreeCoupons } from "@/features/coupons/hooks/use-taxfree-coupons";

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR");
}

function searchRecommendItems(
  items: ShoppingRecommendItem[],
  query: string,
) {
  const normalized = normalizeSearch(query);
  if (!normalized) return items;
  return items.filter((item) =>
    [item.title, item.subtitle, item.spot, item.country, ...item.regions]
      .join(" ")
      .toLocaleLowerCase("ko-KR")
      .includes(normalized),
  );
}

function searchMagazineItems(items: ShoppingMagazineItem[], query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return items;
  return items.filter((item) =>
    [item.title, item.summary, item.tag, item.country, ...item.regions]
      .join(" ")
      .toLocaleLowerCase("ko-KR")
      .includes(normalized),
  );
}

function SectionDivider() {
  return <div className="h-px w-full bg-rule" aria-hidden />;
}

function ShoppingSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [{ draft, sourceValue }, setSearchState] = useState(() => ({
    draft: value,
    sourceValue: value,
  }));
  const [isComposing, setIsComposing] = useState(false);

  // URL 뒤로가기처럼 외부에서 검색어가 바뀐 경우에만 로컬 입력을 맞춘다.
  // 렌더 중 이전 prop을 비교하는 React의 허용된 state 조정 패턴으로,
  // 입력 요소를 재마운트하지 않아 포커스와 커서 위치가 유지된다.
  if (value !== sourceValue) {
    setSearchState({ draft: value, sourceValue: value });
  }

  useEffect(() => {
    if (isComposing || draft === value) return;
    const timer = window.setTimeout(() => onChange(draft), 250);
    return () => window.clearTimeout(timer);
  }, [draft, isComposing, onChange, value]);

  return (
    <div role="search" className="relative">
      <label htmlFor="shopping-search" className="sr-only">
        쇼핑몰과 매거진 검색
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-2"
        strokeWidth={1.8}
        aria-hidden
      />
      <input
        id="shopping-search"
        type="search"
        value={draft}
        onChange={(event) =>
          setSearchState((current) => ({
            ...current,
            draft: event.target.value,
          }))
        }
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={(event) => {
          setSearchState((current) => ({
            ...current,
            draft: event.currentTarget.value,
          }));
          setIsComposing(false);
        }}
        placeholder="쇼핑·투어·맛집 검색"
        autoComplete="off"
        className="h-12 w-full rounded-xl border border-ink-2 bg-paper-2 pr-12 pl-12 text-[15px] text-ink outline-2 outline-transparent outline-offset-1 placeholder:text-ink-3 hover:bg-paper-3 focus:bg-paper focus:outline-focus"
      />
      {draft ? (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() =>
            setSearchState((current) => ({ ...current, draft: "" }))
          }
          className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-ink-2 outline-none hover:bg-paper-3 hover:text-ink active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus"
        >
          <X className="size-4" strokeWidth={1.9} />
        </button>
      ) : null}
    </div>
  );
}

export default function ShoppingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const city = searchParams.get("city");
  const country = searchParams.get("country");
  const destination = useMemo<ShoppingDestination>(
    () => (city && country ? { city, country } : null),
    [city, country],
  );
  const query = searchParams.get("q") ?? "";
  const { data: couponData } = useTaxFreeCoupons();

  const replaceFilterUrl = useCallback(
    (nextDestination: ShoppingDestination, nextQuery: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextDestination) {
        params.set("city", nextDestination.city);
        params.set("country", nextDestination.country);
      } else {
        params.delete("city");
        params.delete("country");
      }
      if (nextQuery.trim()) params.set("q", nextQuery.trim());
      else params.delete("q");
      const search = params.toString();
      router.replace(
        `${pathname}${search ? `?${search}` : ""}${window.location.hash}`,
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  function handleDestinationChange(next: ShoppingDestination) {
    replaceFilterUrl(next, query);
  }

  const handleQueryChange = useCallback(
    (next: string) => replaceFilterUrl(destination, next),
    [destination, replaceFilterUrl],
  );

  const destinationOptions = useMemo(() => {
    const map = new Map<string, { city: string; country: string }>();
    for (const option of SHOPPING_DESTINATION_OPTIONS) {
      map.set(`${option.country}::${option.city}`, option);
    }
    for (const option of listCouponDestinations(couponData?.coupons ?? [])) {
      map.set(`${option.country}::${option.city}`, option);
    }
    return [...map.values()].sort((a, b) => a.city.localeCompare(b.city, "ko"));
  }, [couponData?.coupons]);

  const magazines = useMemo(
    () =>
      searchMagazineItems(
        filterMagazineItems(DEMO_MAGAZINES, destination),
        query,
      ),
    [destination, query],
  );
  const malls = useMemo(
    () =>
      searchRecommendItems(filterRecommendItems(DEMO_MALLS, destination), query),
    [destination, query],
  );
  const tours = useMemo(
    () =>
      searchRecommendItems(filterRecommendItems(DEMO_TOURS, destination), query),
    [destination, query],
  );
  const restaurants = useMemo(
    () =>
      searchRecommendItems(
        filterRecommendItems(DEMO_RESTAURANTS, destination),
        query,
      ),
    [destination, query],
  );

  const hasSearchResults =
    malls.length + magazines.length + tours.length + restaurants.length > 0;
  const searchResultCount =
    malls.length + magazines.length + tours.length + restaurants.length;
  const hasQuery = normalizeSearch(query).length > 0;

  return (
    <AppShell withBottomNav className="px-0">
      <ShotsChannelTabs active="shopping" actions={<HeaderNavActions />} />
      <ShoppingAdDialog ad={DEMO_SHOPPING_AD} />
      <main className="mx-auto flex w-full max-w-[var(--app-rail-max)] flex-col gap-5 px-4 pt-4 pb-6">
        <section aria-label="쇼핑거리 검색" className="flex flex-col gap-3">
          <ShoppingSearch
            value={query}
            onChange={handleQueryChange}
          />
          <ShoppingDestinationFilter
            value={destination}
            options={destinationOptions}
            onChange={handleDestinationChange}
          />
        </section>

        {hasQuery ? (
          <p
            className="text-[13px] font-medium text-ink-2"
            role="status"
            aria-live="polite"
            aria-atomic
          >
            &apos;{query.trim()}&apos; 검색 결과 {searchResultCount}개
          </p>
        ) : null}

        {hasQuery && !hasSearchResults ? (
          <EmptyState
            title="일치하는 쇼핑 정보가 없어요"
            description="검색어를 줄이거나 다른 여행지를 선택해 보세요."
            actionLabel="검색어 지우기"
            onAction={() => handleQueryChange("")}
          />
        ) : (
          <div className="flex flex-col gap-8">
            {malls.length > 0 ? (
              <ShoppingSection
                title="쇼핑할 곳"
                description="매장 위치와 지도 리뷰를 확인할 수 있어요."
              >
                <RecommendRail
                  items={malls}
                  ariaLabel="쇼핑할 곳 목록"
                  showFavorite
                  preloadFirstImage
                />
              </ShoppingSection>
            ) : null}

            {magazines.length > 0 ? (
              <ShoppingSection title="쇼핑 가이드">
                <MagazineList items={magazines} />
              </ShoppingSection>
            ) : null}

            {tours.length > 0 ? (
              <ShoppingSection title="현지 투어">
                <RecommendRail items={tours} ariaLabel="현지 투어 목록" />
              </ShoppingSection>
            ) : null}

            {restaurants.length > 0 ? (
              <ShoppingSection title="근처 맛집">
                <RecommendRail items={restaurants} ariaLabel="근처 맛집 목록" />
              </ShoppingSection>
            ) : null}

            {!hasQuery ? (
              <>
                {hasSearchResults ? <SectionDivider /> : null}
                <CouponSection
                  key={destination ? `${destination.country}-${destination.city}` : "all"}
                  destination={destination}
                />
              </>
            ) : null}
          </div>
        )}
      </main>
    </AppShell>
  );
}
