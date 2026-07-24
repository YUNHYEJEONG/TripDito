import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
        <h1 className="text-xl font-semibold">페이지를 찾을 수 없어요</h1>
        <p className="text-sm text-muted-foreground">주소를 다시 확인해 주세요.</p>
        <Link href="/" className={cn(buttonVariants(), "mt-2")}>
          홈으로
        </Link>
      </div>
    </AppShell>
  );
}
