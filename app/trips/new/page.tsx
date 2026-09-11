"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { TripForm } from "@/features/trips/components/trip-form";
import { useCreateTrip } from "@/features/trips/hooks/use-trips";
import { useRequireLogin } from "@/features/auth/hooks/use-require-login";

function NewTripForm() {
  const router = useRouter();
  const createTrip = useCreateTrip();
  // 홈 "요즘 가기 좋은 해외 도시" 카드 등에서 ?city=&country= 로 미리 채움
  const searchParams = useSearchParams();
  const presetCity = searchParams.get("city")?.trim() || undefined;
  const presetCountry = searchParams.get("country")?.trim() || undefined;

  return (
    <TripForm
      submitLabel="여행 만들기"
      defaultValues={{
        ...(presetCity ? { city: presetCity } : {}),
        ...(presetCountry ? { country: presetCountry } : {}),
      }}
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
  );
}

export default function NewTripPage() {
  useRequireLogin();

  return (
    <AppShell>
      <PageHeader title="새 여행" backHref="/my-trips" />
      <Suspense fallback={null}>
        <NewTripForm />
      </Suspense>
    </AppShell>
  );
}
