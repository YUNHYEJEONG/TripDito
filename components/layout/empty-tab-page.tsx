import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { HeaderNavActions } from "@/components/layout/header-nav-actions";

/** 하단 탭 페이지 골격 — 헤더 + 빈 body */
export function EmptyTabPage({ title }: { title: string }) {
  return (
    <AppShell withBottomNav>
      <PageHeader title={title} actions={<HeaderNavActions />} />
    </AppShell>
  );
}
