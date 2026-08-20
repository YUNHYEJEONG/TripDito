import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PassportScreen } from "@/features/profile/components/passport-screen";
import { PassportTripManager } from "@/features/profile/components/passport-trip-manager";
import {
  getPassportViewHref,
  type PassportView,
} from "@/features/profile/utils/passport-view";
import { cn } from "@/lib/utils";

const passportViews: Array<{
  id: PassportView;
  label: string;
}> = [
  { id: "trips", label: "내 여행" },
  { id: "stamps", label: "여권" },
];

/**
 * 화면 제목을 따로 두지 않고 **탭이 헤더 자리를 차지한다.** 탭은 "여기가 어디인지"와
 * "어디로 갈 수 있는지"를 동시에 말하므로 제목보다 정보량이 많다. 제목 줄을 없앤
 * 48px은 그대로 본문(특히 스크롤이 없어야 하는 여권)으로 간다.
 * 제목은 `sr-only`로 남겨 스크린리더의 화면 식별을 유지한다.
 */
function PassportHubHeader({ activeView }: { activeView: PassportView }) {
  return (
    <header className="sticky top-[env(safe-area-inset-top)] z-30 -mt-3 border-b border-rule bg-paper before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-[env(safe-area-inset-top)] before:bg-paper">
      <h1 className="sr-only">여행</h1>

      {/* 때샷 보기 탭과 동일한 fixed 탭 규격 — 화면 전체를 균등 분할, 밑줄은 탭 폭 전체. */}
      <nav aria-label="여행 보기" className="flex h-12 w-full">
        {passportViews.map((view) => {
          const selected = view.id === activeView;

          return (
            <Link
              key={view.id}
              id={`passport-view-${view.id}`}
              href={getPassportViewHref(view.id)}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "relative inline-flex h-12 min-w-0 flex-1 items-center justify-center px-2 text-[15px] leading-5 whitespace-nowrap outline-none transition-colors duration-120 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-transparent active:bg-paper-2 focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-focus motion-reduce:transition-none",
                selected
                  ? "font-bold text-accent-text after:bg-accent-text"
                  : "font-medium text-ink-2 hover:text-ink active:text-ink",
              )}
            >
              {view.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export function PassportHub({
  activeView,
  stampTripId = null,
  stampPageNumber = null,
  stampReturnTo = "/passport?view=stamps",
}: {
  activeView: PassportView;
  stampTripId?: string | null;
  stampPageNumber?: number | null;
  stampReturnTo?: string;
}) {
  const showsPassport = activeView === "stamps";

  return (
    <AppShell
      withBottomNav
      surface={showsPassport ? "passport" : "compact"}
      className="px-0"
    >
      <PassportHubHeader activeView={activeView} />
      {showsPassport ? (
        <PassportScreen
          embedded
          stampTripId={stampTripId}
          stampPageNumber={stampPageNumber}
          stampReturnTo={stampReturnTo}
        />
      ) : (
        <PassportTripManager />
      )}
    </AppShell>
  );
}
