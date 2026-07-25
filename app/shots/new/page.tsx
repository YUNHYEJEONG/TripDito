"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import {
  PageHeader,
  HeaderCancelButton,
} from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ShotUploadForm } from "@/features/shots/components/shot-upload-form";
import { useCreateShot } from "@/features/shots/hooks/use-shots";

export default function NewShotPage() {
  const router = useRouter();
  const createShot = useCreateShot();

  return (
    <AppShell className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <PageHeader
        title="피드 업로드"
        className="mb-3"
        actions={
          <HeaderCancelButton onClick={() => router.push("/shots")} />
        }
      />
      <ShotUploadForm
        formId="shot-upload-form"
        onSubmit={async (values) => {
          try {
            await createShot.mutateAsync(values);
            toast.success(
              values.channel === "shots"
                ? "때샷을 올렸습니다"
                : "커뮤니티 글을 올렸습니다",
            );
            router.push("/shots");
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "저장에 실패했습니다";
            toast.error(message);
          }
        }}
      />
      <div className="fixed inset-x-0 bottom-0 z-30 bg-canvas px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 md:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[480px] md:max-w-[720px] lg:max-w-[960px]">
          <Button
            type="submit"
            form="shot-upload-form"
            className="w-full"
            disabled={createShot.isPending}
          >
            업로드
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
