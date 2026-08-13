"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { CouponCardList } from "@/features/coupons/components/coupon-card-list";
import { useReceivedCoupons } from "@/features/coupons/hooks/use-received-coupons";

export default function ProfileCouponsPage() {
  const { data: coupons = [], isLoading } = useReceivedCoupons();

  return (
    <AppShell withBottomNav>
      <PageHeader title="쿠폰" backHref="/profile" />

      <main className="mx-auto w-full max-w-[480px]">
        {isLoading ? (
          <p
            className="py-10 text-center text-[13px] text-ink-2"
            role="status"
          >
            쿠폰을 불러오는 중…
          </p>
        ) : coupons.length === 0 ? (
          <EmptyState
            title="받은 쿠폰이 없어요"
            description="쇼핑거리에서 필요한 쿠폰을 받아두면 이곳에 모여요."
          />
        ) : (
          <section aria-labelledby="coupon-count">
            <p
              id="coupon-count"
              className="mb-3 text-[13px] font-medium text-ink-2 tabular-nums"
            >
              보관한 쿠폰 {coupons.length}장
            </p>
            <p className="mb-4 rounded-lg bg-paper-2 px-3 py-3 text-[12px] leading-5 text-ink-2">
              받은 당시 정보예요. 사용 전에 제공처에서 혜택과 조건을 다시
              확인해 주세요.
            </p>
            <CouponCardList coupons={coupons} action="remove" />
          </section>
        )}
      </main>
    </AppShell>
  );
}
