import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <AppShell>
      <PageHeader title="페이지 없음" backHref="/home" />
      <main
        className="mx-auto flex min-h-[64vh] w-full max-w-md flex-col items-center justify-center gap-3 text-center"
        aria-labelledby="not-found-title"
      >
        <h2
          id="not-found-title"
          className="text-[22px] leading-[1.35] font-bold tracking-[-0.02em] text-ink"
        >
          이 페이지는 찾을 수 없어요
        </h2>
        <p className="max-w-sm text-[15px] leading-6 text-ink-2">
          주소가 바뀌었거나 페이지가 삭제되었을 수 있어요.
        </p>
        <Link
          href="/home"
          className={cn(buttonVariants(), "mt-3 min-w-44")}
        >
          홈으로 돌아가기
        </Link>
      </main>
    </AppShell>
  );
}
