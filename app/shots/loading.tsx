import { AppShell } from "@/components/layout/app-shell";

export default function ShotEditorLoading() {
  return (
    <AppShell surface="feed">
      <main className="flex min-h-[48vh] items-center justify-center text-center">
        <p className="text-[14px] font-medium text-ink-2" role="status">
          때샷 편집기를 여는 중…
        </p>
      </main>
    </AppShell>
  );
}
