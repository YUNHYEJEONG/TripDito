import Link from "next/link";
import { ChevronRight, MapPinned } from "lucide-react";

export function HomeNearbyStore({
  city,
  country,
}: {
  city: string;
  country: string;
}) {
  return (
    <section aria-labelledby="nearby-shopping-title">
      <Link
        href={`/map?q=${encodeURIComponent(`${city}, ${country}`)}&returnTo=${encodeURIComponent("/home")}`}
        className="flex min-h-16 items-center gap-3 rounded-xl bg-paper-2 px-4 py-3 outline-none transition-colors duration-120 hover:bg-paper-3 active:bg-paper focus-visible:ring-2 focus-visible:ring-focus"
      >
        <MapPinned className="size-5 shrink-0 text-live-deep" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 id="nearby-shopping-title" className="text-[15px] font-semibold text-ink">
            근처에서 살 곳 찾기
          </h2>
          <p className="mt-1 truncate text-[13px] text-ink-2">
            {city}의 쇼핑 장소를 지도에서 확인해 보세요
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-ink-2" aria-hidden />
      </Link>
    </section>
  );
}
