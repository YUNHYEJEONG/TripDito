"use client";

import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ItemForm } from "@/features/shopping-items/components/item-form";
import { useCreateItem } from "@/features/shopping-items/hooks/use-items";
import { getTripHomeMode } from "@/features/home/utils/get-home-mode";
import { FormPageStatus } from "@/features/trips/components/form-page-status";
import { useTrip } from "@/features/trips/hooks/use-trips";
import { getSafeReturnTo, withReturnTo } from "@/lib/navigation/return-to";

export default function NewItemPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: trip, isLoading, isError, refetch } = useTrip(tripId);
  const settlementRequested = searchParams.get("intent") === "settlement";
  const isSettlement = Boolean(
    settlementRequested && trip && getTripHomeMode(trip) === "after",
  );
  const createItem = useCreateItem(tripId, {
    markPurchased: isSettlement,
    purchasedAt:
      isSettlement && trip
        ? `${trip.endDate}T12:00:00.000Z`
        : undefined,
  });
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));
  const tripHref = withReturnTo(`/trips/${tripId}`, returnTo);

  if (isLoading) {
    return (
      <AppShell surface="planning">
        <PageHeader title="상품 추가" backHref={tripHref} />
        <FormPageStatus
          loading
          title="여행 정보를 불러오고 있어요"
          description="상품을 담을 쇼핑리스트를 확인하고 있어요."
        />
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell surface="planning">
        <PageHeader title="상품 추가" backHref={tripHref} />
        <FormPageStatus
          announce="assertive"
          title="쇼핑리스트를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="쇼핑리스트 다시 불러오기"
          onAction={() => void refetch()}
        />
      </AppShell>
    );
  }

  if (!trip) {
    return (
      <AppShell surface="planning">
        <PageHeader title="상품 추가" backHref={returnTo} />
        <FormPageStatus
          title="여행을 찾을 수 없어요"
          description="홈에서 상품을 담을 여행을 다시 선택해 주세요."
          actionLabel="이전 화면으로 돌아가기"
          onAction={() => router.push(returnTo)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell surface="planning">
      <PageHeader
        title={isSettlement ? "구매 기록 추가" : "상품 추가"}
        backHref={tripHref}
      />
      <ItemForm
        currency={trip.currency}
        tripStartDate={trip.startDate}
        tripEndDate={trip.endDate}
        submitLabel={
          isSettlement ? "구매 기록 저장" : "리스트에 상품 추가"
        }
        onCancel={() => router.push(tripHref)}
        onSubmit={async (values) => {
          try {
            await createItem.mutateAsync(values);
            router.push(tripHref);
          } catch {
            toast.error("상품을 추가하지 못했어요. 다시 시도해 주세요");
          }
        }}
      />
    </AppShell>
  );
}
