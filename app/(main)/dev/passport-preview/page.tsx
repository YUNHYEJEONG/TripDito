"use client";

/**
 * 여권 도장 디자인 미리보기 (개발 전용).
 * 완료된 목데이터 여행으로 도장이 찍힌 여권을 렌더한다.
 * 프로덕션 빌드에서는 notFound 처리.
 */
import { notFound, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PassportScreen } from "@/features/profile/components/passport-screen";
import type { Trip } from "@/features/trips/types";

const base = { currency: "JPY", budget: 500000, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };

const PREVIEW_TRIPS: Trip[] = [
  { ...base, id: "pv-jp", name: "오사카 쇼핑", country: "일본", city: "오사카", startDate: "2026-03-02", endDate: "2026-03-06" },
  { ...base, id: "pv-tw", name: "타이베이 먹방", country: "대만", city: "타이베이", startDate: "2026-01-15", endDate: "2026-01-18" },
  { ...base, id: "pv-fr", name: "파리 신혼여행", country: "프랑스", city: "파리", startDate: "2025-10-04", endDate: "2025-10-12" },
  { ...base, id: "pv-us", name: "뉴욕 출장", country: "미국", city: "뉴욕", startDate: "2025-07-21", endDate: "2025-07-28" },
  { ...base, id: "pv-th", name: "방콕 휴양", country: "태국", city: "방콕", startDate: "2025-05-01", endDate: "2025-05-05" },
  { ...base, id: "pv-kr", name: "제주 힐링", country: "대한민국", city: "제주", startDate: "2025-03-14", endDate: "2025-03-16" },
];

function PassportPreview() {
  const params = useSearchParams();
  return (
    <PassportScreen
      previewTrips={PREVIEW_TRIPS}
      stampTripId={params.get("stampTripId")}
    />
  );
}

export default function PassportPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense>
      <PassportPreview />
    </Suspense>
  );
}
