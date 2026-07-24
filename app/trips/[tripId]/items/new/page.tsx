"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ItemForm } from "@/features/shopping-items/components/item-form";
import { useCreateItem } from "@/features/shopping-items/hooks/use-items";
import { useTrip } from "@/features/trips/hooks/use-trips";

export default function NewItemPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const { data: trip, isLoading } = useTrip(tripId);
  const createItem = useCreateItem(tripId);

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
    <AppShell>
      <PageHeader title="상품 추가" backHref={`/trips/${tripId}`} />
      <ItemForm
        submitLabel="추가"
        onCancel={() => router.push(`/trips/${tripId}`)}
        onSubmit={async (values) => {
          try {
            await createItem.mutateAsync(values);
            toast.success("상품을 추가했습니다");
            router.push(`/trips/${tripId}`);
          } catch {
            toast.error("저장에 실패했습니다");
          }
        }}
      />
    </AppShell>
  );
}
