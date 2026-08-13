import { AppShell, type AppShellSurface } from "@/components/layout/app-shell";

export function RouteLoading({
  label,
  surface = "planning",
  withBottomNav = false,
}: {
  label: string;
  surface?: AppShellSurface;
  withBottomNav?: boolean;
}) {
  return (
    <AppShell withBottomNav={withBottomNav} surface={surface}>
      <main className="flex min-h-[48vh] items-center justify-center text-center">
        <p className="text-[14px] font-medium text-ink-2" role="status">
          {label}
        </p>
      </main>
    </AppShell>
  );
}
