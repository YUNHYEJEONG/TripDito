"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ShoppingSection } from "@/features/shopping/components/shopping-section";
import {
  DEMO_TRENDING_CITIES,
  type TrendingCity,
} from "@/features/shopping/data/demo-shopping-content";
import { cn } from "@/lib/utils";

function CityCard({ city }: { city: TrendingCity }) {
  return (
    <Link
      href={`/trips/new?city=${encodeURIComponent(city.city)}&country=${encodeURIComponent(city.country)}`}
      className={cn(
        "group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
        city.tone,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={city.imageSrc}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/0" />
      <span className="absolute top-2.5 left-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur">
        {city.season}
      </span>
      <div className="absolute inset-x-0 bottom-0 px-3 pb-3">
        <p className="text-[11px] font-medium text-white/75">{city.country}</p>
        <p className="text-[17px] font-bold leading-tight text-white">
          {city.city}
        </p>
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/85">
          {city.reason}
        </p>
      </div>
    </Link>
  );
}

/**
 * 홈(비로그인) — 요즘 가기 좋은 해외 도시
 * 카드를 누르면 해당 도시로 새 여행 만들기로 이동
 */
export function HomeTrendingCities() {
  return (
    <ShoppingSection
      title="요즘 가기 좋은 해외 도시"
      description="지금 떠나기 좋은 곳, 쇼핑까지 알차게"
    >
      <ul
        aria-label="요즘 가기 좋은 해외 도시 목록"
        className={cn(
          "-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {DEMO_TRENDING_CITIES.map((city) => (
          <li key={city.id} className="w-[136px] shrink-0">
            <CityCard city={city} />
          </li>
        ))}
      </ul>
      <Link
        href="/shopping"
        className="inline-flex items-center gap-1 self-start text-[12px] font-semibold text-primary"
      >
        쇼핑 탭에서 더 보기
        <ArrowRight className="size-3.5" />
      </Link>
    </ShoppingSection>
  );
}
