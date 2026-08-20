"use client";

import { use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/features/shopping-items/components/item-form";
import {
  useDeleteItem,
  useItem,
  useUpdateItem,
} from "@/features/shopping-items/hooks/use-items";
import { FormPageStatus } from "@/features/trips/components/form-page-status";
import { useTrip } from "@/features/trips/hooks/use-trips";
import { getSafeReturnTo, withReturnTo } from "@/lib/navigation/return-to";

export default function EditItemPage({
  params,
}: {
  params: Promise<{ tripId: string; itemId: string }>;
}) {
  const { tripId, itemId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    data: trip,
    isLoading: tripLoading,
    isError: tripError,
    refetch: refetchTrip,
  } = useTrip(tripId);
  const {
    data: item,
    isLoading: itemLoading,
    isError: itemError,
    refetch: refetchItem,
  } = useItem(itemId);
  const updateItem = useUpdateItem(tripId, itemId);
  const deleteItem = useDeleteItem(tripId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));
  const tripHref = withReturnTo(`/trips/${tripId}`, returnTo);

  if (tripLoading || itemLoading) {
    return (
      <AppShell surface="planning">
        <PageHeader title="상품 수정" backHref={tripHref} />
        <FormPageStatus
          loading
          title="상품 정보를 불러오고 있어요"
          description="저장된 가격과 구매 계획을 확인하고 있어요."
        />
      </AppShell>
    );
  }

  if (tripError || itemError) {
    return (
      <AppShell surface="planning">
        <PageHeader title="상품 수정" backHref={tripHref} />
        <FormPageStatus
          announce="assertive"
          title="상품 정보를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="상품 정보 다시 불러오기"
          onAction={() => {
            void refetchTrip();
            void refetchItem();
          }}
        />
      </AppShell>
    );
  }

  if (!trip || !item || item.tripId !== tripId) {
    const recoveryHref =
      item && item.tripId !== tripId
        ? withReturnTo(`/trips/${item.tripId}`, returnTo)
        : "/passport";
    const recoveryLabel =
      item && item.tripId !== tripId
        ? "상품이 담긴 쇼핑리스트로"
        : "내 여행으로 돌아가기";

    return (
      <AppShell surface="planning">
        <PageHeader title="상품 수정" backHref={recoveryHref} />
        <FormPageStatus
          title="상품을 찾을 수 없어요"
          description="삭제되었거나 다른 여행에 담긴 상품일 수 있어요."
          actionLabel={recoveryLabel}
          onAction={() => router.push(recoveryHref)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell surface="planning">
      <PageHeader title="상품 수정" backHref={tripHref} />
      <ItemForm
        defaultValues={item}
        currency={trip.currency}
        tripStartDate={trip.startDate}
        tripEndDate={trip.endDate}
        submitLabel="변경 내용 저장"
        onCancel={() => router.push(tripHref)}
        onSubmit={async (values) => {
          try {
            await updateItem.mutateAsync(values);
            router.push(tripHref);
          } catch {
            toast.error("변경 내용을 저장하지 못했어요. 다시 시도해 주세요");
          }
        }}
      />
      <section className="mx-auto mt-8 w-full max-w-2xl border-t border-rule pt-6">
        <h2 className="text-[15px] font-semibold text-ink">상품 삭제</h2>
        <p className="mt-1 text-[13px] leading-5 text-ink-2">
          이 상품만 쇼핑리스트에서 삭제해요.
        </p>
        <Button
          variant="destructive"
          className="mt-4 w-full"
          onClick={() => setConfirmOpen(true)}
        >
          이 상품 삭제
        </Button>
      </section>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="상품을 삭제할까요?"
        description="삭제하면 되돌릴 수 없어요."
        confirmLabel="상품 삭제"
        loading={deleteItem.isPending}
        onConfirm={() => {
          deleteItem.mutate(itemId, {
            onSuccess: () => {
              router.replace(tripHref);
            },
            onError: () =>
              toast.error("상품을 삭제하지 못했어요. 다시 시도해 주세요"),
          });
        }}
      />
    </AppShell>
  );
}
