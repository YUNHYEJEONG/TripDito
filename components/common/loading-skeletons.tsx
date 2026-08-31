import { Skeleton } from "@/components/ui/skeleton";

/**
 * 화면별 로딩 스켈레톤 모음.
 * "불러오는 중…" 텍스트 대신 실제 콘텐츠와 같은 골격을 보여줘
 * 로딩 → 콘텐츠 전환 시 화면이 덜컥거리지 않게 한다.
 */

/** 세로 카드 리스트 (내여행·쿠폰 등) */
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-1.5" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
        >
          <Skeleton className="size-12 shrink-0 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 홈 대문 — 큰 여행 카드 + 환율/배너 자리 */
export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className="rounded-2xl border border-border bg-card p-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3.5 w-1/3" />
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-2.5 h-7 w-1/2" />
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  );
}

/** 떼샷 피드 — 포스트 카드 골격 */
export function FeedSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 sm:px-5 md:px-6 lg:px-8" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

/** 프로필 — 아바타 카드 + 메뉴 줄 */
export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="rounded-2xl bg-surface-gray p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4.5 w-1/3" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** 로딩 상태 공통 래퍼 — 스크린리더에 로딩을 알린다 */
export function LoadingRegion({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-label="불러오는 중">
      {children}
      <span className="sr-only">불러오는 중…</span>
    </div>
  );
}
