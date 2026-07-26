"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/common/toast-alert";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/features/shopping-items/components/item-form";
import {
  useDeleteItem,
  useItem,
  useUpdateItem,
} from "@/features/shopping-items/hooks/use-items";
import { useTrip } from "@/features/trips/hooks/use-trips";

export default function EditItemPage({
  params,
}: {
  params: Promise<{ tripId: string; itemId: string }>;
}) {
  const { tripId, itemId } = use(params);
  const router = useRouter();
  const { data: trip, isLoading: tripLoading } = useTrip(tripId);
  const { data: item, isLoading: itemLoading } = useItem(itemId);
  const updateItem = useUpdateItem(tripId, itemId);
  const deleteItem = useDeleteItem(tripId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (tripLoading || itemLoading) {
    return (
      <AppShell>
        <p className="py-16 text-center text-sm text-muted-foreground">
          불러오는 중…
        </p>
      </AppShell>
    );
  }

  if (!trip || !item || item.tripId !== tripId) {
    return (
      <AppShell>
        <EmptyState
          title="상품을 찾을 수 없어요"
          actionLabel="리스트로"
          onAction={() => router.push(`/trips/${tripId}`)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="상품 정보 수정" backHref={`/trips/${tripId}`} />
      <ItemForm
        defaultValues={item}
        currency={trip.currency}
        purchased={item.purchased}
        tripStartDate={trip.startDate}
        tripEndDate={trip.endDate}
        submitLabel="수정"
        onCancel={() => router.push(`/trips/${tripId}`)}
        onSubmit={async (values) => {
          try {
            await updateItem.mutateAsync(values);
            toast.success("상품을 수정했습니다");
            router.push(`/trips/${tripId}`);
          } catch {
            toast.error("저장에 실패했습니다");
          }
        }}
      >
        <div className="border-t border-border/60 pt-4">
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            onClick={() => setConfirmOpen(true)}
          >
            상품 삭제
          </Button>
        </div>
      </ItemForm>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="상품을 삭제할까요?"
        confirmLabel="삭제"
        loading={deleteItem.isPending}
        onConfirm={() => {
          deleteItem.mutate(itemId, {
            onSuccess: () => {
              toast.success("상품을 삭제했습니다");
              router.push(`/trips/${tripId}`);
            },
            onError: () => toast.error("삭제에 실패했습니다"),
          });
        }}
      />
    </AppShell>
  );
}
