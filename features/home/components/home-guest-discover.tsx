"use client";

import { RecommendRail } from "@/features/shopping/components/recommend-rail";
import { ShoppingSection } from "@/features/shopping/components/shopping-section";
import {
  DEMO_MALLS,
  DEMO_RESTAURANTS,
  DEMO_TOURS,
} from "@/features/shopping/data/demo-shopping-content";
import { HomeTrendingCities } from "./home-trending-cities";

/**
 * 홈(비로그인) 둘러보기 — 새 여행 CTA와 광고 사이
 * 쇼핑 탭의 요즘 뜨는 쇼핑몰 · 투어 추천 · 고독한 미식가 맛집 + 요즘 가기 좋은 해외 도시
 */
export function HomeGuestDiscover() {
  return (
    <>
      <HomeTrendingCities />

      <ShoppingSection
        title="요즘 뜨는 쇼핑몰"
        description="현지에서 자주 찾는 쇼핑 스팟"
      >
        <RecommendRail items={DEMO_MALLS} ariaLabel="요즘 뜨는 쇼핑몰 목록" />
      </ShoppingSection>

      <ShoppingSection
        title="투어 추천"
        description="쇼핑과 함께 즐기기 좋은 투어"
      >
        <RecommendRail items={DEMO_TOURS} ariaLabel="투어 추천 목록" />
      </ShoppingSection>

      <ShoppingSection
        title="고독한 미식가에 나온 맛집"
        description="장보고 들르기 좋은 근처 맛집"
      >
        <RecommendRail
          items={DEMO_RESTAURANTS}
          ariaLabel="고독한 미식가에 나온 맛집 목록"
        />
      </ShoppingSection>
    </>
  );
}
