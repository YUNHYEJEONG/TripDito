"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Trip } from "@/features/trips/types";
import { CurrencyText } from "@/components/common/currency-text";
import {
  formatScheduleBadge,
  getTripScheduleLabel,
} from "@/features/home/utils/get-upcoming-trip";
import {
  formatTripStayWithPeriod,
  getTripBackgroundSrc,
} from "@/features/home/utils/trip-card-meta";
import { withReturnTo } from "@/lib/navigation/return-to";

export function getHomeTripCardAction(
  trip: Trip,
  today?: string,
): {
  href: string;
  label: string;
  ariaLabel: string;
  schedule: ReturnType<typeof getTripScheduleLabel>;
} {
  const schedule = getTripScheduleLabel(trip, today);

  // 대문을 누르면 **어느 상태에서든 여행 상세**로 간다. 여행 중에만 지도로 새면 같은 자리를
  // 눌렀는데 다른 곳이 열려서, 어디로 가는지 매번 확인해야 한다. 지도는 헤더 아이콘이 맡는다.
  const href = withReturnTo(
    `/trips/${encodeURIComponent(trip.id)}`,
    "/home",
  );

  if (schedule.kind === "ongoing") {
    return {
      href,
      label: "여행 중인 쇼핑 계획 보기",
      ariaLabel: `${trip.name} 쇼핑 계획 보기`,
      schedule,
    };
  }

  if (schedule.kind === "past") {
    return {
      href,
      label: "지난 여행 기록 보기",
      ariaLabel: `${trip.name} 기록 보기`,
      schedule,
    };
  }

  return {
    href,
    label: "다가오는 여행 계획 보기",
    ariaLabel: `${trip.name} 계획 보기`,
    schedule,
  };
}

/**
 * 홈 대문. **지금 어떤 여행을 보고 있는지**를 말하는 자리이므로, 여행을 바꾸는 것도 여기서 한다.
 *
 * 카드 전체는 상세(또는 지도)로 가는 링크이고, 그 위에 도시 이름만 별도 버튼으로 얹어
 * 여행 전환 시트를 연다. 링크 안에 버튼을 중첩하면 마크업이 깨지므로, 링크를 `absolute inset-0`
 * 오버레이로 깔고 본문은 `pointer-events-none`으로 통과시킨 뒤 전환 버튼만 다시 살린다.
 */
export function HomeUpcomingTripCard({
  trip,
  progress,
  shoppingAmount,
  today,
  onChangeTrip,
}: {
  trip: Trip;
  progress?: number;
  /** 예정·진행 여행은 리스트 예상 총액, 완료 여행은 구매완료 기록 금액 */
  shoppingAmount: number;
  today?: string;
  /** 여행이 둘 이상일 때만 전달된다. 없으면 도시 이름은 그냥 글자다. */
  onChangeTrip?: () => void;
}) {
  const action = getHomeTripCardAction(trip, today);
  const label = action.schedule;
  const badge = formatScheduleBadge(label);
  const bgSrc = getTripBackgroundSrc(trip.country, trip.city);
  const periodLabel = formatTripStayWithPeriod(trip.startDate, trip.endDate);
  const showProgress = label.kind === "ongoing" && typeof progress === "number";

  return (
    <section
      className="group relative min-h-[148px] overflow-hidden rounded-2xl bg-ink"
      style={{
        backgroundImage: `url(${bgSrc})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="absolute inset-0 bg-ink/75 transition-colors duration-120 group-has-[a:hover]:bg-ink/80 group-has-[a:active]:bg-ink/90"
        aria-hidden
      />

      {/* 카드 전체를 덮는 기본 링크. 본문 위가 아니라 아래에 깔린다. */}
      <Link
        href={action.href}
        aria-label={action.ariaLabel}
        className="absolute inset-0 z-10 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
      />

      <div className="pointer-events-none relative z-20 flex min-h-[148px] flex-col justify-between gap-3 px-4 py-4 pr-11 text-paper">
        <h2 className="pr-14 text-[13px] font-semibold tracking-tight text-paper">
          {action.label}
        </h2>

        <span className="absolute top-4 right-3 rounded-md bg-gift-acq px-2 py-1 text-[11px] font-semibold text-ink">
          {badge}
        </span>

        <div className="min-w-0">
          {onChangeTrip ? (
            <button
              type="button"
              onClick={onChangeTrip}
              aria-haspopup="dialog"
              aria-label={`${trip.city} — 다른 여행으로 바꾸기`}
              className="pointer-events-auto -mx-1 flex min-w-0 max-w-full items-center gap-1 rounded-lg px-1 outline-none transition-colors duration-120 hover:bg-paper/15 active:bg-paper/25 focus-visible:ring-2 focus-visible:ring-paper"
            >
              <h3 className="truncate text-[22px] font-bold tracking-tight text-paper">
                {trip.city}
              </h3>
              <ChevronDown
                className="size-5 shrink-0 text-paper/80"
                strokeWidth={2.5}
                aria-hidden
              />
            </button>
          ) : (
            <h3 className="truncate text-[22px] font-bold tracking-tight text-paper">
              {trip.city}
            </h3>
          )}
          <p className="mt-2 w-fit text-[12px] text-paper/80">{periodLabel}</p>
          <div className="mt-2 flex w-fit flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
            <span className="text-paper/80">
              {label.kind === "past" ? "기록금액" : "필요예산"}{" "}
              <CurrencyText
                amount={shoppingAmount}
                currency={trip.currency}
                className="font-semibold text-paper"
              />
            </span>
            {showProgress ? (
              <span className="font-medium text-paper/90">
                구매 {Math.round(progress * 100)}%
              </span>
            ) : null}
          </div>
        </div>

        <ChevronRight
          className="absolute top-1/2 right-3 size-5 shrink-0 -translate-y-1/2 text-paper/80 transition-transform duration-120 group-has-[a:hover]:translate-x-0.5"
          aria-hidden
        />
      </div>
    </section>
  );
}
