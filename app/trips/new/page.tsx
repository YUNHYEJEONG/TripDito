"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { NewTripWizard } from "@/features/trips/components/new-trip-wizard";
import { useCreateTrip } from "@/features/trips/hooks/use-trips";
import { getSafeReturnTo, withReturnTo } from "@/lib/navigation/return-to";
import { itemRepository } from "@/features/shopping-items/data/item-repository";
import { useSelectActiveTrip } from "@/features/home/hooks/use-active-trip";

const INTERNAL_ORIGIN = "https://tripdito.local";

function withCreatedTrip(returnTo: string, tripId: string) {
  const target = new URL(returnTo, INTERNAL_ORIGIN);
  if (target.pathname === "/shots/new") {
    target.searchParams.set("tripId", tripId);
  }
  return `${target.pathname}${target.search}${target.hash}`;
}

export default function NewTripPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createTrip = useCreateTrip();
  const selectActiveTrip = useSelectActiveTrip();
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));
  const returnPathname = new URL(returnTo, INTERNAL_ORIGIN).pathname;
  const copyItemIds = [...new Set(searchParams.getAll("copyItemId"))].filter(
    (id) => Boolean(itemRepository.getById(id)),
  );
  const isContinuation =
    returnPathname === "/shots/new" ||
    returnPathname === "/map" ||
    copyItemIds.length > 0;

  return (
    <AppShell surface="planning">
      <PageHeader
        title="새 여행"
        description="3단계로 간단히 등록해요"
        backHref={returnTo}
      />
      <NewTripWizard
        isSubmitting={createTrip.isPending}
        onSubmit={async (values) => {
          try {
            const trip = await createTrip.mutateAsync(values);
            await selectActiveTrip.mutateAsync(trip.id);
            if (copyItemIds.length > 0) {
              itemRepository.copyManyToTrip(copyItemIds, trip.id);
            }
            if (isContinuation) {
              router.replace(withCreatedTrip(returnTo, trip.id));
            } else {
              router.push(withReturnTo(`/trips/${trip.id}`, returnTo));
            }
          } catch {
            toast.error("여행을 만들지 못했어요. 다시 시도해 주세요");
          }
        }}
      />
    </AppShell>
  );
}
