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
      <PageHeader title="내가 받은 쿠폰" backHref="/profile" />

      {isLoading ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          불러오는 중…
        </p>
      ) : coupons.length === 0 ? (
        <EmptyState
          title="받은 쿠폰이 없어요"
          description="쇼핑 탭에서 쿠폰을 받으면 여기에 모여요."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-muted-foreground">
            총 {coupons.length}장
          </p>
          <CouponCardList coupons={coupons} />
        </div>
      )}
    </AppShell>
  );
}
