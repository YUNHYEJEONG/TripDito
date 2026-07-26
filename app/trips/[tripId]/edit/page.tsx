"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/common/toast-alert";
import { AppShell } from "@/components/layout/app-shell";
import {
  PageHeader,
  HeaderCancelButton,
} from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { TripForm } from "@/features/trips/components/trip-form";
import {
  useDeleteTrip,
  useTrip,
  useUpdateTrip,
} from "@/features/trips/hooks/use-trips";

export default function EditTripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const { data: trip, isLoading } = useTrip(tripId);
  const updateTrip = useUpdateTrip(tripId);
  const deleteTrip = useDeleteTrip();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <AppShell>
        <p className="py-16 text-center text-sm text-muted-foreground">
          불러오는 중…
        </p>
      </AppShell>
    );
  }

  if (!trip) {
    return (
      <AppShell>
        <EmptyState
          title="여행을 찾을 수 없어요"
          actionLabel="목록으로"
          onAction={() => router.push("/")}
        />
      </AppShell>
    );
  }

  return (
    <AppShell className="pb-28">
      <PageHeader
        title="내 여행 수정"
        actions={
          <HeaderCancelButton
            onClick={() => router.push(`/trips/${tripId}`)}
          />
        }
      />
      <TripForm
        tripId={trip.id}
        defaultValues={trip}
        submitLabel="수정"
        onSubmit={async (values) => {
          try {
            await updateTrip.mutateAsync(values);
            toast.success("여행을 수정했습니다");
            router.push(`/trips/${tripId}`);
          } catch {
            toast.error("저장에 실패했습니다");
          }
        }}
      >
        <div className="mt-2 border-t border-border/60 pt-6">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setConfirmOpen(true)}
          >
            여행 삭제
          </Button>
        </div>
      </TripForm>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="여행을 삭제할까요?"
        description="쇼핑리스트 상품도 함께 삭제됩니다."
        confirmLabel="삭제"
        loading={deleteTrip.isPending}
        onConfirm={() => {
          deleteTrip.mutate(tripId, {
            onSuccess: () => {
              toast.success("여행을 삭제했습니다");
              router.push("/");
            },
            onError: () => toast.error("삭제에 실패했습니다"),
          });
        }}
      />
    </AppShell>
  );
}
