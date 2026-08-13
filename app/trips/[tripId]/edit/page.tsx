"use client";

import { use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { FormPageStatus } from "@/features/trips/components/form-page-status";
import { TripForm } from "@/features/trips/components/trip-form";
import {
  useDeleteTrip,
  useTrip,
  useUpdateTrip,
} from "@/features/trips/hooks/use-trips";
import { getSafeReturnTo, withReturnTo } from "@/lib/navigation/return-to";
import { useItems } from "@/features/shopping-items/hooks/use-items";
import { normalizePlannedPurchaseDates } from "@/features/shopping-items/utils/trip-day";
import type { TripFormValues } from "@/features/trips/schema";

function isoDayDistance(from: string, to: string) {
  return Math.round(
    (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) /
      86_400_000,
  );
}

function addIsoDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export default function EditTripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: trip, isLoading, isError, refetch } = useTrip(tripId);
  const { data: items = [], isLoading: itemsLoading } = useItems(tripId);
  const updateTrip = useUpdateTrip(tripId);
  const deleteTrip = useDeleteTrip();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [scheduleConfirmOpen, setScheduleConfirmOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<TripFormValues | null>(null);
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));
  const tripHref = withReturnTo(`/trips/${tripId}`, returnTo);

  if (isLoading || itemsLoading) {
    return (
      <AppShell surface="planning">
        <PageHeader title="여행 수정" backHref={tripHref} />
        <FormPageStatus
          loading
          title="여행 정보를 불러오고 있어요"
          description="저장된 일정과 예산을 확인하고 있어요."
        />
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell surface="planning">
        <PageHeader title="여행 수정" backHref={tripHref} />
        <FormPageStatus
          announce="assertive"
          title="여행 정보를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="여행 정보 다시 불러오기"
          onAction={() => void refetch()}
        />
      </AppShell>
    );
  }

  if (!trip) {
    return (
      <AppShell surface="planning">
        <PageHeader title="여행 수정" backHref={returnTo} />
        <FormPageStatus
          title="여행을 찾을 수 없어요"
          description="홈에서 다른 여행을 선택해 주세요."
          actionLabel="이전 화면으로 돌아가기"
          onAction={() => router.push(returnTo)}
        />
      </AppShell>
    );
  }

  async function saveTrip(values: TripFormValues) {
    try {
      await updateTrip.mutateAsync(values);
      setScheduleConfirmOpen(false);
      setPendingUpdate(null);
      router.push(tripHref);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "변경 내용을 저장하지 못했어요. 다시 시도해 주세요",
      );
    }
  }

  const scheduledItems = items.filter(
    (item) => normalizePlannedPurchaseDates(item).length > 0,
  );
  const clippedDateCount = pendingUpdate
    ? items.reduce((count, item) => {
        const nextDates = normalizePlannedPurchaseDates(item).map((date) =>
          addIsoDays(
            pendingUpdate.startDate,
            isoDayDistance(trip.startDate, date),
          ),
        );
        return (
          count +
          nextDates.filter(
            (date) =>
              date < pendingUpdate.startDate || date > pendingUpdate.endDate,
          ).length
        );
      }, 0)
    : 0;

  return (
    <AppShell surface="planning">
      <PageHeader title="여행 수정" backHref={tripHref} />
      <TripForm
        tripId={tripId}
        defaultValues={trip}
        lockCurrency={items.length > 0}
        submitLabel="변경 내용 저장"
        onCancel={() => router.push(tripHref)}
        onSubmit={async (values) => {
          const dateChanged =
            values.startDate !== trip.startDate || values.endDate !== trip.endDate;
          if (dateChanged && scheduledItems.length > 0) {
            setPendingUpdate(values);
            setScheduleConfirmOpen(true);
            return;
          }
          await saveTrip(values);
        }}
      />
      <section className="mx-auto mt-8 w-full max-w-2xl border-t border-rule pt-6">
        <h2 className="text-[15px] font-semibold text-ink">여행 삭제</h2>
        <p className="mt-1 text-[13px] leading-5 text-ink-2">
          여행을 삭제하면 연결된 쇼핑리스트도 함께 사라져요.
        </p>
        <Button
          variant="destructive"
          className="mt-4 w-full"
          onClick={() => setConfirmOpen(true)}
        >
          이 여행 삭제
        </Button>
      </section>
      <ConfirmDialog
        open={scheduleConfirmOpen}
        onOpenChange={(open) => {
          setScheduleConfirmOpen(open);
          if (!open) setPendingUpdate(null);
        }}
        title="상품 구매일도 함께 옮길까요?"
        description={
          <>
            구매일이 있는 상품 {scheduledItems.length}개의 일차를 새 일정에 맞춰
            옮겨요.
            {clippedDateCount > 0
              ? ` 새 여행 기간을 벗어나는 날짜 ${clippedDateCount}개는 비우고 상품에 확인 표시를 남겨요.`
              : " 모든 구매일이 새 여행 기간 안에 유지돼요."}
          </>
        }
        confirmLabel="일정과 구매일 변경"
        cancelLabel="날짜 다시 보기"
        confirmVariant="default"
        loading={updateTrip.isPending}
        onConfirm={() => {
          if (pendingUpdate) void saveTrip(pendingUpdate);
        }}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="여행을 삭제할까요?"
        description="쇼핑리스트 상품도 함께 삭제되고, 되돌릴 수 없어요."
        confirmLabel="여행 삭제"
        loading={deleteTrip.isPending}
        onConfirm={() => {
          deleteTrip.mutate(tripId, {
            onSuccess: () => {
              router.push(returnTo);
            },
            onError: () =>
              toast.error("여행을 삭제하지 못했어요. 다시 시도해 주세요"),
          });
        }}
      />
    </AppShell>
  );
}
