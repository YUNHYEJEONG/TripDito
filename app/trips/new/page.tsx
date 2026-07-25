"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { TripForm } from "@/features/trips/components/trip-form";
import { useCreateTrip } from "@/features/trips/hooks/use-trips";

export default function NewTripPage() {
  const router = useRouter();
  const createTrip = useCreateTrip();

  return (
    <AppShell>
      <PageHeader title="새 여행" backHref="/home" />
      <TripForm
        submitLabel="여행 만들기"
        onCancel={() => router.push("/")}
        onSubmit={async (values) => {
          try {
            const trip = await createTrip.mutateAsync(values);
            toast.success("여행을 만들었습니다");
            router.push(`/trips/${trip.id}`);
          } catch {
            toast.error("저장에 실패했습니다");
          }
        }}
      />
    </AppShell>
  );
}
