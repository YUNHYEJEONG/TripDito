import Link from "next/link";
import { ChevronRight, Luggage, Plane, ReceiptText } from "lucide-react";
import { CurrencyText } from "@/components/common/currency-text";
import type { BudgetSummary } from "@/features/budget/utils/calculate-budget";
import type { ShoppingItem } from "@/features/shopping-items/types";
import type { Trip } from "@/features/trips/types";
import {
  getArrivalCode,
  getCurrentTripDay,
  getDaysUntilTrip,
  type HomeMode,
} from "@/features/home/utils/get-home-mode";
import { cn } from "@/lib/utils";
import { withReturnTo } from "@/lib/navigation/return-to";

export function getLivePurchaseProgressHref(tripId: string) {
  return withReturnTo(`/trips/${encodeURIComponent(tripId)}`, "/home");
}

export function HomeStatusHero({
  trip,
  mode,
  summary,
  items,
  approximateKrw,
  onSwitchTrip,
  today,
}: {
  trip: Trip;
  mode: Exclude<HomeMode, "idle">;
  summary: BudgetSummary;
  items: ShoppingItem[];
  approximateKrw?: number;
  onSwitchTrip: () => void;
  today?: string;
}) {
  const progress = Math.round(summary.purchaseProgress * 100);
  const budgetProgress =
    trip.budgetMode === "input" && trip.budget > 0
      ? Math.min(100, Math.round((summary.purchasedTotal / trip.budget) * 100))
      : progress;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border text-left",
        mode === "prep" && "border-prep-tint bg-prep",
        mode === "live" && "border-live-tint bg-live text-live-ink",
        mode === "after" && "border-after-tint bg-after",
      )}
    >
      {mode === "prep" ? (
        <PrepStatus
          trip={trip}
          progress={progress}
          onSwitchTrip={onSwitchTrip}
          today={today}
        />
      ) : mode === "live" ? (
        <LiveStatus
          trip={trip}
          summary={summary}
          budgetProgress={budgetProgress}
          onSwitchTrip={onSwitchTrip}
          today={today}
        />
      ) : (
        <AfterStatus
          trip={trip}
          summary={summary}
          items={items}
          approximateKrw={approximateKrw}
          onSwitchTrip={onSwitchTrip}
        />
      )}
    </div>
  );
}

function TripManagerButton({
  trip,
  onClick,
}: {
  trip: Trip;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-ink/8 bg-paper/75 px-3 py-2.5 text-left shadow-sm outline-none transition-colors duration-120 hover:bg-paper active:bg-paper-2 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      aria-label={`내 여행 목록 열기, 현재 ${trip.name}`}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-paper text-ink shadow-neu-inset">
        <Luggage className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold text-ink-2">내 여행</span>
        <strong className="mt-0.5 block truncate text-[15px] font-semibold text-ink">
          {trip.name}
        </strong>
        <span className="mt-0.5 block truncate text-[12px] text-ink-2">
          {trip.city} · 여행 선택 및 관리
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-ink">
        목록
        <ChevronRight className="size-4" aria-hidden />
      </span>
    </button>
  );
}

function PrepStatus({
  trip,
  progress,
  onSwitchTrip,
  today,
}: {
  trip: Trip;
  progress: number;
  onSwitchTrip: () => void;
  today?: string;
}) {
  const days = getDaysUntilTrip(trip, today);
  const arrival = getArrivalCode(trip);
  const hasAirportCode = /^[A-Z]{3}$/.test(arrival);

  return (
    <div className="px-5 py-5">
      <TripManagerButton trip={trip} onClick={onSwitchTrip} />
      <div className="mt-4 flex justify-end">
        <StatusPill mode="prep" label="예정" />
      </div>

      <div className="mt-6 flex items-center gap-3" aria-label={`출발지에서 ${trip.city}까지`}>
        <strong className="text-[19px] leading-none tracking-[-0.03em] text-ink">
          출발
        </strong>
        <span className="flex flex-1 items-center gap-2 text-prep-deep" aria-hidden>
          <span className="h-px flex-1 border-t border-dashed border-prep-deep/50" />
          <Plane className="size-5 rotate-45" />
          <span className="h-px flex-1 border-t border-dashed border-prep-deep/50" />
        </span>
        <strong
          className={cn(
            "min-w-0 truncate text-right leading-none tracking-[-0.04em] text-ink",
            hasAirportCode ? "text-[28px]" : "max-w-[9ch] text-[20px]",
          )}
          title={hasAirportCode ? undefined : arrival}
        >
          {arrival}
        </strong>
      </div>

      <div className="-mx-5 mt-5 border-t border-dashed border-prep-deep/35" aria-hidden />

      <div className="mt-4 flex flex-col gap-4 min-[360px]:flex-row min-[360px]:items-end min-[360px]:justify-between">
        <div>
          <p className="text-[12px] font-medium text-ink-2">출발까지</p>
          <p className="mt-1 text-[38px] font-bold leading-none tracking-[-0.04em] text-prep-deep">
            {days === 0 ? "D-Day" : `D-${days}`}
          </p>
        </div>
        <ProgressMeter
          label="쇼핑 준비율"
          value={progress}
          trackClassName="bg-prep-tint"
          indicatorClassName="bg-accent"
        />
      </div>
    </div>
  );
}

function LiveStatus({
  trip,
  summary,
  budgetProgress,
  onSwitchTrip,
  today,
}: {
  trip: Trip;
  summary: BudgetSummary;
  budgetProgress: number;
  onSwitchTrip: () => void;
  today?: string;
}) {
  const day = getCurrentTripDay(trip, today);

  return (
    <div className="px-5 py-5">
      <TripManagerButton trip={trip} onClick={onSwitchTrip} />
      <div className="mt-4 flex justify-end">
        <StatusPill mode="live" label="여행 중" />
      </div>
      <p className="mt-5 text-[52px] font-bold leading-none tracking-[-0.045em] text-live-deep">
        {day}일차
      </p>
      <div className="mt-6 flex flex-col gap-4 min-[360px]:flex-row min-[360px]:items-end min-[360px]:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-live-sub">남은 예산</p>
          <p className="mt-1 text-[22px] leading-tight font-bold tracking-[-0.02em] text-live-ink [overflow-wrap:anywhere]">
            {trip.budgetMode === "unknown" ? (
              "미정"
            ) : (
              <CurrencyText
                amount={summary.remainingBudget}
                currency={trip.currency}
              />
            )}
          </p>
        </div>
        <ProgressMeter
          label="예산 사용"
          value={budgetProgress}
          trackClassName="bg-live-tint"
          indicatorClassName="bg-live-accent"
        />
      </div>
      <Link
        href={getLivePurchaseProgressHref(trip.id)}
        aria-label="구매 진행률과 구매 내역 보기"
        className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-live-deep px-4 text-[14px] font-semibold text-paper outline-none transition-colors duration-120 hover:bg-live-ink active:bg-live-ink focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-live"
      >
        <ReceiptText className="size-5" aria-hidden />
        구매 기록 보기
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

function AfterStatus({
  trip,
  summary,
  items,
  approximateKrw,
  onSwitchTrip,
}: {
  trip: Trip;
  summary: BudgetSummary;
  items: ShoppingItem[];
  approximateKrw?: number;
  onSwitchTrip: () => void;
}) {
  const purchased = items.filter((item) => item.purchased);
  const purchasedQuantity = purchased.reduce(
    (sum, item) => sum + Math.max(1, item.quantity),
    0,
  );
  const giftCount = purchased
    .filter((item) => item.giftTags.length > 0)
    .reduce((sum, item) => sum + Math.max(1, item.quantity), 0);

  return (
    <div className="px-5 py-5">
      <TripManagerButton trip={trip} onClick={onSwitchTrip} />
      <div className="mt-4 flex justify-end">
        <StatusPill mode="after" label="결산" />
      </div>
      <h2 className="mt-5 max-w-[15ch] text-[27px] font-bold leading-[1.25] tracking-[-0.03em] text-ink">
        {trip.city}에서 {purchasedQuantity}개, 잘 담아 왔어요
      </h2>
      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-after-tint pt-4">
        <Metric label="구매 총액">
          <CurrencyText
            amount={summary.purchasedTotal}
            currency={trip.currency}
          />
        </Metric>
        <Metric label="원화 환산">
          {typeof approximateKrw === "number" ? (
            <span>
              ≈ <CurrencyText amount={approximateKrw} currency="KRW" />
            </span>
          ) : (
            "—"
          )}
        </Metric>
        <Metric label="선물">{giftCount}개</Metric>
      </dl>
    </div>
  );
}

function StatusPill({
  mode,
  label,
}: {
  mode: Exclude<HomeMode, "idle">;
  label: string;
}) {
  return (
    <span
      aria-label={`여행 상태: ${label}`}
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-3 py-1 text-[11px] font-semibold text-paper shadow-sm",
        mode === "prep" && "bg-prep-deep",
        mode === "live" && "bg-live-deep",
        mode === "after" && "bg-after-deep",
      )}
    >
      {label}
    </span>
  );
}

function Metric({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-after-ink-2">{label}</dt>
      <dd className="mt-1 text-[14px] leading-5 font-semibold text-ink [overflow-wrap:anywhere]">
        {children}
      </dd>
    </div>
  );
}

function ProgressMeter({
  label,
  value,
  trackClassName,
  indicatorClassName,
}: {
  label: string;
  value: number;
  trackClassName: string;
  indicatorClassName: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full min-w-0 max-w-none min-[360px]:w-[42%] min-[360px]:min-w-[112px] min-[360px]:max-w-44">
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-medium text-ink-2">
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>
      <div
        className={cn("h-1.5 overflow-hidden rounded-full", trackClassName)}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeValue}
      >
        <div
          className={cn("h-full rounded-full", indicatorClassName)}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
