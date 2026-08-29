"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Plane } from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type RefObject,
} from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PassportStampArtwork } from "@/features/profile/components/passport-stamp-artwork";
import {
  getPassportPageIndexAfterLayoutChange,
  getPassportPageNavigation,
  getPassportPageRange,
  shouldShowPassportPageNavigation,
  type PassportPage,
} from "@/features/profile/utils/passport-pagination";
import {
  getPassportSecurityPageDesign,
  getPassportSecuritySvgIds,
  type PassportSecurityMotif,
  type PassportSecurityPageDesign,
} from "@/features/profile/utils/passport-security-paper";
import {
  FULL_TURN_MS,
  easeOutTurn,
  usePassportPageTurn,
} from "@/features/profile/hooks/use-passport-page-turn";
import {
  assignPassportStampPage,
  getPassportStampFlow,
  readPassportStampPageAssignments,
  savePassportStampPageAssignments,
} from "@/features/profile/utils/passport-stamp-flow";
import { getPassportStampPlacements } from "@/features/profile/utils/passport-stamp-layout";
import { getPassportTripHref } from "@/features/profile/utils/passport-stamp";
import { getCompletedPassportTrips } from "@/features/profile/utils/passport-trips";
import {
  getPassportStampHeadingLabel,
  getPassportStampIntentHref,
} from "@/features/profile/utils/passport-view";
import { useTrips } from "@/features/trips/hooks/use-trips";
import type { Trip } from "@/features/trips/types";
import { useHydrated } from "@/lib/react/use-hydrated";
import { cn } from "@/lib/utils";
import stampFlowStyles from "./passport-stamp-flow.module.css";

const pageStyle: CSSProperties = {
  backgroundColor: "var(--passport-paper)",
  backgroundImage:
    "radial-gradient(circle at 16% 14%, rgba(65, 126, 144, 0.1) 0 0.7px, transparent 1px), radial-gradient(circle at 76% 62%, rgba(96, 138, 155, 0.06) 0 0.7px, transparent 1px), linear-gradient(145deg, var(--passport-paper-hi) 0%, var(--passport-paper-mint) 48%, var(--passport-paper-warm) 100%)",
  backgroundSize: "9px 9px, 13px 13px, auto",
};

const coverStyle: CSSProperties = {
  backgroundColor: "var(--passport-cover)",
  backgroundImage:
    "radial-gradient(circle at 88% 10%, rgba(119, 169, 181, 0.16), transparent 28%), repeating-linear-gradient(125deg, rgba(255, 255, 255, 0.018) 0 1px, transparent 1px 5px), linear-gradient(145deg, var(--passport-cover-hi) 0%, var(--passport-cover-mid) 55%, var(--passport-cover-lo) 100%)",
};

/**
 * 종이가 젖혀지는 최대 각도.
 *
 * 여권을 **한 면만** 보여 주므로 제본선이 곧 화면 왼쪽 끝이다. 90°를 넘기면 종이가
 * 책 밖(왼쪽)으로 나가 잘리기 때문에, 180°까지 돌리면 애니메이션의 **절반이 보이지
 * 않는다.** 앞으로 넘길 때 특히 어색한데, 종이가 모서리까지 세워진 뒤 남은 시간 동안
 * 아무 일도 일어나지 않는 것처럼 보이기 때문이다.
 *
 * 90°까지만 돌리면 앞으로·뒤로 모두 전 구간이 화면 안에서 일어난다 —
 * 앞으로는 종이가 제본선 쪽으로 접혀 사라지고, 뒤로는 제본선에서 펼쳐져 나온다.
 */
const PAGE_TURN_MAX_ANGLE = 90;

/** 도장 흐름에서 표지를 저절로 넘기기 전에 보여 주는 시간. 표지를 읽을 만큼만 짧게 둔다. */
const COVER_HOLD_MS = 520;
/** 자동으로 장을 넘길 때 장 사이에 두는 간격. 넘긴 장이 눈에 맺힐 만큼만 쉰다. */
const AUTO_TURN_GAP_MS = 140;

const guillocheRotations = [
  0, 18, 36, 54, 72, 90, 108, 126, 144, 162,
] as const;
const securityCurveOffsets = [-18, -12, -6, 0, 6, 12, 18] as const;

/** 문장의 꽃잎 5장이 놓이는 각도. 하나가 정확히 위를 향한다. */
const emblemPetalAngles = [0, 72, 144, 216, 288] as const;
/** 꽃잎 하나. 중심에서 r=6.4(속테)부터 시작해 바깥으로 뻗는다. */
const emblemPetalPath = "M20 13.6C15.2 10.8 15.2 6.6 20 4 24.8 6.6 24.8 10.8 20 13.6Z";

/**
 * 여권 표지의 문장(紋章).
 *
 * 실제 대한민국 나라문장은 정부기관 전용이라 옮겨 쓸 수 없다. 그래서 여권 문장이
 * 공통으로 쓰는 **형식**(원형 메달리온 + 다섯 꽃잎)만 빌리고, 가운데 태극 자리에는
 * 여행 제품에 맞는 나침반을 넣은 디토 고유 마크다.
 */
function DitoPassportEmblem() {
  return (
    <svg
      viewBox="0 0 40 40"
      className="size-8 shrink-0"
      fill="none"
      role="presentation"
    >
      {emblemPetalAngles.map((angle) => (
        <path
          key={angle}
          d={emblemPetalPath}
          transform={`rotate(${angle} 20 20)`}
          fill="currentColor"
          fillOpacity="0.42"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      ))}
      <circle cx="20" cy="20" r="6.4" stroke="currentColor" strokeWidth="1" />
      <path
        d="M20 14.8 21.8 18.2 25.2 20 21.8 21.8 20 25.2 18.2 21.8 14.8 20 18.2 18.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PassportMemoryMotif({
  motif,
  design,
}: {
  motif: PassportSecurityMotif;
  design: PassportSecurityPageDesign;
}) {
  switch (motif) {
    case "ridge-memory":
      return (
        <>
          <path
            d="M-78 39C-58 18-43 12-28 25-9 42 2 34 18 10c14-21 30-17 44 6 9 15 18 22 30 21v23H-78Z"
            fill={design.mint}
            fillOpacity="0.055"
          />
          <path
            d="M-75 42C-52 19-39 19-24 31-6 45 5 31 20 8c13-19 29-13 43 10 10 16 18 21 29 19"
            stroke={design.ink}
            strokeOpacity="0.075"
            strokeWidth="1.15"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M-66 48C-48 32-36 31-20 42M-7 43c9-5 18-15 27-30m7 2c8 6 14 15 20 27"
            stroke={design.apricot}
            strokeOpacity="0.07"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />
        </>
      );
    case "coast-memory":
      return (
        <>
          <path
            d="M-76-8C-47-35-21-31 4-7c22 21 43 23 70-5v52c-25 19-48 17-70-3-26-24-51-21-80 7Z"
            fill={design.sky}
            fillOpacity="0.05"
          />
          <path
            d="M-76-9C-48-34-22-31 3-8c23 21 45 22 73-7M-75 6c28-23 54-20 78 2 23 21 46 20 72-4M-72 22c25-19 48-16 72 5 22 20 45 19 72-2"
            stroke={design.ink}
            strokeOpacity="0.075"
            strokeWidth="0.9"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx="49"
            cy="-31"
            r="10"
            fill={design.apricot}
            fillOpacity="0.065"
          />
        </>
      );
    case "travel-tag":
      return (
        <>
          <path
            d="M-50-41h57l39 39v38c0 9-7 16-16 16h-80c-9 0-16-7-16-16v-61c0-9 7-16 16-16Z"
            fill={design.apricot}
            fillOpacity="0.05"
            stroke={design.ink}
            strokeOpacity="0.075"
            strokeWidth="1.1"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx="17"
            cy="-16"
            r="6"
            stroke={design.sky}
            strokeOpacity="0.075"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M-43 12c15-18 31-18 48 0 14 15 27 16 41 2M-38 27h43"
            stroke={design.mint}
            strokeOpacity="0.075"
            strokeLinecap="round"
            strokeWidth="0.95"
            vectorEffect="non-scaling-stroke"
          />
        </>
      );
    case "route-waypoint":
      return (
        <>
          <path
            d="M-70 30C-49-25-11-37 17-7c23 25 39 24 59-8"
            stroke={design.ink}
            strokeDasharray="3 5"
            strokeOpacity="0.075"
            strokeLinecap="round"
            strokeWidth="1.05"
            vectorEffect="non-scaling-stroke"
          />
          <g fill={design.sky} fillOpacity="0.065">
            <circle cx="-66" cy="22" r="7" />
            <circle cx="17" cy="-7" r="7" />
            <circle cx="70" cy="-10" r="7" />
          </g>
          <g
            fill="none"
            stroke={design.apricot}
            strokeOpacity="0.075"
            strokeWidth="0.85"
          >
            <circle cx="-66" cy="22" r="12" vectorEffect="non-scaling-stroke" />
            <circle cx="17" cy="-7" r="12" vectorEffect="non-scaling-stroke" />
            <circle cx="70" cy="-10" r="12" vectorEffect="non-scaling-stroke" />
          </g>
        </>
      );
  }
}

const PassportSecurityPaper = memo(function PassportSecurityPaper({
  pageNumber,
}: {
  pageNumber: number;
}) {
  const instanceId = useId();
  const design = getPassportSecurityPageDesign(pageNumber);
  const svgIds = getPassportSecuritySvgIds(pageNumber, instanceId);
  const curveColors = [
    design.mint,
    design.sky,
    design.apricot,
    design.sand,
  ] as const;

  return (
    <div
      aria-hidden
      data-passport-security-motif={design.motif}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ backgroundColor: design.paper }}
    >
      <svg
        viewBox="0 0 256 320"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full mix-blend-multiply"
        fill="none"
        role="presentation"
      >
        <defs>
          <linearGradient id={svgIds.paperWash} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={design.mint} stopOpacity="0.19" />
            <stop offset="0.46" stopColor={design.sky} stopOpacity="0.1" />
            <stop offset="0.78" stopColor={design.apricot} stopOpacity="0.14" />
            <stop offset="1" stopColor={design.sand} stopOpacity="0.17" />
          </linearGradient>
          <radialGradient id={svgIds.rosetteWash} cx="50%" cy="50%" r="52%">
            <stop offset="0" stopColor={design.sky} stopOpacity="0.08" />
            <stop offset="0.62" stopColor={design.mint} stopOpacity="0.035" />
            <stop offset="1" stopColor={design.mint} stopOpacity="0" />
          </radialGradient>
          <pattern
            id={svgIds.microPattern}
            width="30"
            height="20"
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${design.wavePhase} 0)`}
          >
            <path
              d="M-8 10C0 1 7 1 15 10s15 9 23 0"
              stroke={design.sky}
              strokeOpacity="0.26"
              strokeWidth="0.25"
            />
            <path
              d="M-8 14C0 5 7 5 15 14s15 9 23 0"
              stroke={design.mint}
              strokeOpacity="0.22"
              strokeWidth="0.22"
            />
          </pattern>
        </defs>

        <rect width="256" height="320" fill={design.paper} />
        <rect width="256" height="320" fill={`url(#${svgIds.paperWash})`} />
        <rect width="256" height="320" fill={`url(#${svgIds.microPattern})`} />

        <path
          d="M0 0h96C67 26 45 62 31 107 18 151 7 175 0 182Z"
          fill={design.mint}
          fillOpacity="0.055"
        />
        <path
          d="M256 320h-92c27-28 49-62 63-104 13-40 22-69 29-86Z"
          fill={design.apricot}
          fillOpacity="0.05"
        />

        <g fill="none" strokeLinecap="round">
          {securityCurveOffsets.map((offset, index) => (
            <path
              key={`upper-${offset}`}
              d="M-92 78C-35 20 23 25 74 84c46 54 105 60 164 7 44-40 89-42 136-11"
              transform={`translate(${design.wavePhase - 28} ${offset})`}
              stroke={curveColors[index % curveColors.length]}
              strokeOpacity={index === 3 ? "0.24" : "0.16"}
              strokeWidth={index === 3 ? "0.62" : "0.38"}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {securityCurveOffsets.map((offset, index) => (
            <path
              key={`lower-${offset}`}
              d="M-88 244C-19 193 40 204 88 252c45 44 99 43 157-5 41-34 83-36 126-12"
              transform={`translate(${-design.wavePhase / 2} ${offset})`}
              stroke={curveColors[(index + 1) % curveColors.length]}
              strokeOpacity={index === 3 ? "0.2" : "0.13"}
              strokeWidth={index === 3 ? "0.58" : "0.34"}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        <circle
          cx={design.rosetteX}
          cy={design.rosetteY}
          r="91"
          fill={`url(#${svgIds.rosetteWash})`}
        />
        <g
          transform={`translate(${design.rosetteX} ${design.rosetteY}) rotate(${design.motifRotation})`}
          fill="none"
        >
          <ellipse
            rx="88"
            ry="42"
            transform="rotate(-24)"
            stroke={design.mint}
            strokeOpacity="0.065"
            strokeWidth="13"
            vectorEffect="non-scaling-stroke"
          />
          <ellipse
            rx="82"
            ry="49"
            transform="rotate(28)"
            stroke={design.sky}
            strokeOpacity="0.06"
            strokeWidth="10"
            vectorEffect="non-scaling-stroke"
          />
          <ellipse
            rx="73"
            ry="36"
            transform="rotate(67)"
            stroke={design.apricot}
            strokeOpacity="0.06"
            strokeWidth="9"
            vectorEffect="non-scaling-stroke"
          />
          <ellipse
            rx="78"
            ry="53"
            transform="rotate(88)"
            stroke={design.sand}
            strokeOpacity="0.055"
            strokeWidth="7"
            vectorEffect="non-scaling-stroke"
          />
        </g>
        <g
          transform={`translate(${design.rosetteX} ${design.rosetteY}) rotate(${design.motifRotation})`}
          fill="none"
          opacity="0.075"
        >
          {guillocheRotations.map((rotation, index) => (
            <ellipse
              key={rotation}
              rx={70 - index * 1.35}
              ry={25 + (index % 4) * 3.4}
              transform={`rotate(${rotation})`}
              stroke={curveColors[index % curveColors.length]}
              strokeWidth="0.48"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        <g fill="none" strokeLinecap="round">
          {[-5, 0, 5, 10].map((offset, index) => (
            <path
              key={offset}
              d="M-18 286C28 267 65 271 102 290c37 19 75 19 113-1 34-18 70-20 108-5"
              transform={`translate(${design.wavePhase / 3} ${offset})`}
              stroke={curveColors[index % curveColors.length]}
              strokeOpacity="0.27"
              strokeWidth="0.38"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path
            d="M26 288C63 273 96 281 127 292c32 12 63 8 101-8"
            stroke={design.ink}
            strokeDasharray="2 5"
            strokeOpacity="0.24"
            strokeWidth="0.48"
            vectorEffect="non-scaling-stroke"
          />
        </g>
        <g fill={design.ink} fillOpacity="0.22">
          <circle cx="26" cy="288" r="1.6" />
          <circle cx="127" cy="292" r="1.6" />
          <circle cx="228" cy="284" r="1.6" />
        </g>

      </svg>

      <svg
        viewBox="-80 -60 160 120"
        preserveAspectRatio="xMidYMid meet"
        className="absolute top-[51%] left-1/2 aspect-[4/3] w-[76%] -translate-x-1/2 -translate-y-1/2 mix-blend-multiply"
        fill="none"
        role="presentation"
      >
        <g transform={`rotate(${design.motifRotation})`}>
          <PassportMemoryMotif motif={design.motif} design={design} />
        </g>
      </svg>
    </div>
  );
});

// Tailwind `max-[900px]` compiles to the exclusive range `width < 900px`.
// Keep the JS page step on exactly the same interval so a 900px viewport
// cannot advance two pages while CSS renders only one.
const foldPassportQuery = "(min-width: 700px) and (max-width: 899.98px)";

function subscribeToFoldPassportLayout(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(foldPassportQuery);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getFoldPassportLayoutSnapshot() {
  return window.matchMedia(foldPassportQuery).matches;
}

function getFoldPassportLayoutServerSnapshot() {
  return false;
}

function useFoldPassportLayout() {
  return useSyncExternalStore(
    subscribeToFoldPassportLayout,
    getFoldPassportLayoutSnapshot,
    getFoldPassportLayoutServerSnapshot,
  );
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
}

function stampMonth(dateKey: string) {
  const [year, month] = dateKey.split("-");
  return `${year}.${month}`;
}

function tripDuration(startDate: string, endDate: string) {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  const nights = Math.max(0, Math.round((end - start) / 86_400_000));
  return nights === 0 ? "당일" : `${nights}박 ${nights + 1}일`;
}

function tripLinkLabel(trip: Trip) {
  return `${trip.country} ${trip.city}, 완료한 여행, ${stampMonth(trip.endDate)}, ${tripDuration(trip.startDate, trip.endDate)}`;
}

/**
 * 최소 높이를 두지 않는다 — 두면 작은 화면에서 내지 밖으로 밀려 잘린다.
 * 어차피 가운데 정렬이라 남는 높이를 그대로 쓰면 된다.
 */
function EmptyPassportPage({ showMessage }: { showMessage: boolean }) {
  return (
    <div
      aria-hidden={!showMessage || undefined}
      className="relative z-[1] flex min-h-0 flex-1 flex-col items-center justify-center px-5 text-center text-[var(--passport-ink-3)]"
    >
      <span className="flex size-20 -rotate-[5deg] items-center justify-center rounded-full border border-[var(--passport-ink-brand)]/35 text-[var(--passport-ink-brand)]/55">
        <span className="flex size-16 items-center justify-center rounded-full border border-[var(--passport-foil-ring)]/45">
          <Plane
            className="size-7 rotate-[35deg]"
            strokeWidth={1.4}
            aria-hidden
          />
        </span>
      </span>
      {showMessage ? (
        <>
          <p className="mt-4 text-[14px] font-bold text-[var(--passport-ink)]">
            아직 찍힌 도장이 없어요
          </p>
          <p className="mt-1 max-w-48 text-[11px] leading-4">
            여행을 마치면 이 페이지에 추억이 남아요.
          </p>
        </>
      ) : (
        <span className="mt-3 text-[9px] font-bold tracking-[0.18em]">
          NEXT JOURNEY
        </span>
      )}
    </div>
  );
}

const PassportPhysicalPage = memo(function PassportPhysicalPage({
  page,
  pageNumber,
  showEmptyMessage = false,
  foldOnly = false,
  hasPageNavigation,
  tripReturnTo,
  stampChoice,
  imprintingTripId = null,
  focusStampTripId = null,
  focusStampLinkRef,
}: {
  page?: PassportPage<Trip>;
  pageNumber: number;
  showEmptyMessage?: boolean;
  foldOnly?: boolean;
  hasPageNavigation: boolean;
  tripReturnTo: string;
  stampChoice?: {
    city: string;
    selectable: boolean;
    onSelect: () => void;
  };
  imprintingTripId?: string | null;
  focusStampTripId?: string | null;
  focusStampLinkRef?: RefObject<HTMLAnchorElement | null>;
}) {
  const trips = page?.trips ?? [];
  const stampPlacements = getPassportStampPlacements(trips, { pageNumber });
  const placementByTripId = new Map(
    stampPlacements.map((placement) => [placement.tripId, placement]),
  );

  return (
    <section
      aria-label={`${pageNumber}쪽`}
      aria-hidden={!page && foldOnly ? true : undefined}
      className={cn(
        // 스크롤 금지 — 화면에서 크롬을 뺀 높이를 그대로 쓴다. 최소 높이를 두면
        // 작은 화면에서 넘쳐 스크롤이 생긴다.
        // 여백은 도장이 커질 자리를 뺏는 만큼만 남긴다 — 실제 여권도 도장이
        // 가장자리까지 찍힌다. 아래 여백은 넘김 버튼(높이 44 + bottom-4)에 가려지지
        // 않을 최소치다.
        "relative h-[var(--passport-page-height)] min-w-0 overflow-hidden px-2 pt-3 text-[var(--passport-ink)] min-[360px]:px-3",
        hasPageNavigation ? "pb-14" : "pb-6",
        foldOnly && "hidden min-[700px]:max-[900px]:flex",
        !foldOnly && "flex",
        "flex-col",
      )}
      style={pageStyle}
    >
      <PassportSecurityPaper pageNumber={pageNumber} />

      {trips.length > 0 ? (
        <ol
          aria-hidden={stampChoice ? true : undefined}
          inert={stampChoice ? true : undefined}
          className={cn(
            "relative z-10 min-h-0 flex-1",
            stampChoice && "pointer-events-none",
          )}
        >
          {trips.map((trip) => {
            const placement = placementByTripId.get(trip.id);
            if (!placement) return null;

            return (
              /*
               * 칸이 곧 컨테이너다. 도장 폭을 `min(100cqw / …, 100cqh / …)`로 풀면
               * **기울어진 뒤의 외곽까지** 칸 안에 들어가므로, 화면 비율이 어떻든
               * 네 도장이 한 장을 가득 채우면서 서로 겹치지 않는다.
               */
              <li
                key={trip.id}
                data-stamp-layout={placement.pattern}
                className="absolute [container-type:size]"
                style={{
                  left: `${placement.cell.left}%`,
                  top: `${placement.cell.top}%`,
                  width: `${placement.cell.width}%`,
                  height: `${placement.cell.height}%`,
                }}
              >
                <Link
                  ref={
                    trip.id === focusStampTripId
                      ? focusStampLinkRef
                      : undefined
                  }
                  href={getPassportTripHref(trip.id, tripReturnTo)}
                  aria-label={tripLinkLabel(trip)}
                  data-passport-stamp-trip-id={trip.id}
                  data-passport-stamp-focus-target={
                    trip.id === focusStampTripId ? "true" : undefined
                  }
                  style={{
                    width: `min(100cqw / ${placement.widthFactor}, 100cqh / ${placement.heightFactor})`,
                    aspectRatio: `${placement.aspectRatio}`,
                    translate: "-50% -50%",
                    rotate: `${placement.rotationOffset}deg`,
                  }}
                  className="absolute top-1/2 left-1/2 flex min-h-11 min-w-11 items-center justify-center rounded-2xl outline-none transition-transform duration-120 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[var(--passport-ink-deep)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--passport-paper-load)] motion-reduce:transition-none"
                >
                  <span
                    className={cn(
                      "block size-full",
                      imprintingTripId === trip.id && stampFlowStyles.impression,
                    )}
                  >
                    <PassportStampArtwork trip={trip} size="notebook" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <EmptyPassportPage showMessage={showEmptyMessage} />
      )}

      {stampChoice ? (
        <button
          type="button"
          disabled={!stampChoice.selectable}
          aria-label={
            stampChoice.selectable
              ? `${pageNumber}쪽에 ${stampChoice.city} 도장 찍기`
              : `${pageNumber}쪽은 도장이 가득 찼어요`
          }
          onClick={stampChoice.onSelect}
          className="group absolute inset-0 z-20 flex items-center justify-center bg-[var(--passport-paper)]/10 px-4 outline-none transition-colors duration-120 enabled:active:bg-[var(--passport-paper-press)]/35 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--passport-ink-deep)] motion-reduce:transition-none"
        >
          <span
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-[12px] font-extrabold shadow-sm transition-colors duration-120 motion-reduce:transition-none",
              stampChoice.selectable
                ? "border-[var(--passport-rule)] bg-[var(--passport-paper-nav)]/95 text-[var(--passport-ink-nav)] group-active:bg-[var(--passport-paper-press)]"
                : "border-[var(--passport-rule-3)]/50 bg-[var(--passport-paper-nav)]/80 text-[var(--passport-ink-3)]",
            )}
          >
            {stampChoice.selectable
              ? `${pageNumber}쪽에 찍기`
              : "도장이 가득 찼어요"}
          </span>
        </button>
      ) : null}

      <span
        aria-hidden
        className="absolute right-4 bottom-3 z-[1] text-[10px] font-semibold text-[var(--passport-ink-soft)] tabular-nums"
      >
        {pageNumber}
      </span>
    </section>
  );
});

function PassportBook({
  trips,
  stampTripId,
  stampPageNumber,
  stampReturnTo,
}: {
  trips: Trip[];
  stampTripId: string | null;
  stampPageNumber: number | null;
  stampReturnTo: string;
}) {
  const router = useRouter();
  const pageViewId = useId();
  const isFoldLayout = useFoldPassportLayout();
  const prefersReducedMotion = useReducedMotion();
  const [assignments, setAssignments] = useState(
    readPassportStampPageAssignments,
  );
  const [imprintingTripId, setImprintingTripId] = useState<string | null>(null);
  const [justStampedPageNumber, setJustStampedPageNumber] = useState<
    number | null
  >(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const pendingFocusTripIdRef = useRef<string | null>(null);
  const focusStampLinkRef = useRef<HTMLAnchorElement | null>(null);
  // Turning progress changes every animation frame. Keep page objects stable so
  // the memoized physical pages and their dense security SVGs do not rerender.
  const stampFlow = useMemo(
    () => getPassportStampFlow(trips, assignments, stampTripId),
    [assignments, stampTripId, trips],
  );

  /**
   * 여권은 **언제나 닫힌 채로** 시작한다. 도장을 찍으러 들어왔다면 표지부터 저절로 열리고
   * 목표 장까지 한 장씩 넘어간다 — 도장이 어디에 찍히는지 보여 주는 게 이 흐름의 요점이다.
   */
  const [coverState, setCoverState] = useState<"closed" | "opening" | "open">(
    // 이미 찍힌 도장을 보러 왔으면 표지도 넘기지 않는다. 볼 것은 그 장 하나뿐이다.
    () => (stampFlow.state === "already-stamped" ? "open" : "closed"),
  );

  /**
   * 도장 흐름이 **끝났는지**. 한 번 켜지면 자동 열기·자동 넘김이 다시는 걸리지 않는다.
   * 이게 없으면 찍은 뒤 이전 장으로 가려 할 때마다 자동 진행이 목표 장으로 되끌어당긴다.
   */
  const [stampFlowDone, setStampFlowDone] = useState(false);

  /** 표지가 젖혀진 정도(0=닫힘, 1=완전히 열림). 쪽 넘김과 같은 값·같은 곡선을 쓴다. */
  const [coverProgress, setCoverProgress] = useState(0);
  const coverFrameRef = useRef<number | null>(null);

  const openCover = useCallback(() => {
    if (coverFrameRef.current !== null) return;
    // 모션을 줄이는 설정이면 젖히는 동작 없이 곧바로 펼친다.
    if (prefersReducedMotion) {
      setCoverState("open");
      return;
    }

    setCoverState("opening");
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / FULL_TURN_MS);
      setCoverProgress(easeOutTurn(t));
      if (t < 1) {
        coverFrameRef.current = requestAnimationFrame(step);
        return;
      }
      coverFrameRef.current = null;
      setCoverState("open");
    };
    coverFrameRef.current = requestAnimationFrame(step);
  }, [prefersReducedMotion]);

  useEffect(
    () => () => {
      if (coverFrameRef.current !== null) {
        cancelAnimationFrame(coverFrameRef.current);
      }
    },
    [],
  );

  const impressionTimerRef = useRef<number | null>(null);
  const justStampedTripId =
    justStampedPageNumber !== null ? (stampFlow.target?.id ?? null) : null;
  const pages = stampFlow.pages;

  /**
   * 표지가 저절로 열리는 건 **새로 찍으러 왔을 때뿐**이다. 이미 찍힌 도장을 보러 온 경우는
   * 표지도 넘김도 없이 그 장에서 시작한다 — 찾아가는 과정을 다시 보여 줄 이유가 없다.
   */
  const autoOpensCover = stampFlow.state === "select-page";

  /**
   * **새로 찍으러 왔을 때만** 첫 장부터 한 장씩 넘어간다. 넘어가는 장 수가 곧 "여권이
   * 이만큼 찼다"는 정보이고, 도장이 어디쯤 놓이는지도 그래야 보인다.
   *
   * 이미 찍힌 도장을 보러 온 경우는 **그 장으로 바로 간다.** 어디 있는지 이미 아는 것을
   * 찾아가는 과정을 다시 보여 줄 이유가 없다.
   *
   * 목표를 마지막 장으로 잡으면 안 된다. 도장 고르기 흐름은 목록 끝에 **깨끗한 새 장을 하나
   * 덧붙여** 두므로, 2번째 장에 자리가 남아 있어도 그 새 장까지 지나쳐 간다. 실제 여권도
   * 빈 자리부터 채운다.
   */
  const autoTurnTargetIndex = useMemo(
    () =>
      stampFlow.state === "select-page"
        ? (stampFlow.selectablePageIndices[0] ?? pages.length - 1)
        : null,
    [pages.length, stampFlow.selectablePageIndices, stampFlow.state],
  );

  // 한 장씩 넘어갈 때만 **표지 바로 뒤 첫 장**에서 출발한다. 그래야 넘기는 과정이 보인다.
  const [requestedPageIndex, setRequestedPageIndex] = useState(() =>
    autoTurnTargetIndex !== null ? 0 : stampFlow.initialPageIndex,
  );
  const navigation = getPassportPageNavigation(
    requestedPageIndex,
    pages.length,
    isFoldLayout ? 2 : 1,
  );
  const currentPage = pages[navigation.index];
  const nextFoldPage = pages[navigation.index + 1];
  const visiblePageCount = isFoldLayout ? 2 : 1;
  const hasPageNavigation = shouldShowPassportPageNavigation(
    pages.length,
    visiblePageCount,
  );
  const currentPageRange = getPassportPageRange(
    navigation.index,
    pages.length,
    visiblePageCount,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(foldPassportQuery);

    function alignPageToLayout(event: MediaQueryListEvent) {
      setRequestedPageIndex((currentIndex) =>
        getPassportPageIndexAfterLayoutChange(
          currentIndex,
          pages.length,
          event.matches,
        ),
      );
    }

    mediaQuery.addEventListener("change", alignPageToLayout);
    return () => mediaQuery.removeEventListener("change", alignPageToLayout);
  }, [pages.length]);

  function targetPageLabel(index: number | null) {
    if (index === null) return null;
    return getPassportPageRange(
      index,
      pages.length,
      visiblePageCount,
    ).pageLabel;
  }

  const previousPageIndex = navigation.previousIndex;
  const nextPageIndex = navigation.nextIndex;
  function commitTurn(direction: "previous" | "next") {
    const target =
      direction === "previous" ? previousPageIndex : nextPageIndex;
    if (target !== null) setRequestedPageIndex(target);
  }

  const { dragHandlers, turn, turnBy, isTurning } = usePassportPageTurn({
    canGoPrevious: navigation.canGoPrevious,
    canGoNext: navigation.canGoNext,
    onTurnComplete: commitTurn,
    reducedMotion: prefersReducedMotion,
  });

  /**
   * 도장 찍으러 들어온 흐름만 **저절로** 열린다. 목적지가 정해져 있으므로 표지에서 한 번,
   * 장마다 한 번씩 누르게 하면 그저 관문이다. 그냥 여권을 보러 온 경우는 직접 연다.
   */
  useEffect(() => {
    if (stampFlowDone) return;
    if (!autoOpensCover || coverState !== "closed") return;
    const timer = window.setTimeout(openCover, COVER_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [autoOpensCover, coverState, openCover, stampFlowDone]);

  /**
   * 표지가 열린 뒤 목표 장까지 **한 장씩** 넘긴다. 한 번에 건너뛰면 도장이 어디쯤에
   * 찍히는지 알 수 없다 — 넘어가는 장 수가 곧 "여권이 이만큼 찼다"는 정보다.
   *
   * 한 장이 끝나면 `turn`이 `null`로 돌아오고 이 효과가 다시 돌아 다음 장을 넘긴다.
   * 사용자가 도중에 직접 넘기면 목표를 지나칠 수 있으므로 `>=`로 멈춘다.
   */
  useEffect(() => {
    if (stampFlowDone || autoTurnTargetIndex === null) return;
    if (coverState !== "open" || turn) return;
    // 목표에 닿으면 그걸로 끝. 이후 사용자가 어디로 넘기든 다시 개입하지 않는다.
    if (navigation.index >= autoTurnTargetIndex) {
      setStampFlowDone(true);
      return;
    }

    const timer = window.setTimeout(() => turnBy("next"), AUTO_TURN_GAP_MS);
    return () => window.clearTimeout(timer);
  }, [
    autoTurnTargetIndex,
    coverState,
    navigation.index,
    stampFlowDone,
    turn,
    turnBy,
  ]);

  useEffect(() => {
    return () => {
      if (impressionTimerRef.current !== null) {
        window.clearTimeout(impressionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const pendingTripId = pendingFocusTripIdRef.current;
    const targetLink = focusStampLinkRef.current;
    if (
      !pendingTripId ||
      !justStampedTripId ||
      targetLink?.dataset.passportStampTripId !== pendingTripId ||
      targetLink.dataset.passportStampFocusTarget !== "true"
    ) {
      return;
    }

    function focusNewStamp() {
      const link = focusStampLinkRef.current;
      if (
        link?.dataset.passportStampTripId !== pendingTripId ||
        link.dataset.passportStampFocusTarget !== "true"
      ) {
        return;
      }
      link.focus({ preventScroll: true });
      pendingFocusTripIdRef.current = null;
    }

    if (prefersReducedMotion) {
      focusNewStamp();
      return;
    }

    const frame = window.requestAnimationFrame(focusNewStamp);
    return () => window.cancelAnimationFrame(frame);
  }, [justStampedPageNumber, justStampedTripId, prefersReducedMotion]);

  function selectStampPage(pageIndex: number) {
    const target = stampFlow.target;
    if (
      !target ||
      stampFlow.state !== "select-page" ||
      isTurning ||
      !stampFlow.selectablePageIndices.includes(pageIndex)
    ) {
      return;
    }

    const pageNumber = pageIndex + 1;
    const nextAssignments = assignPassportStampPage(
      assignments,
      target.id,
      pageNumber,
    );
    const stored = savePassportStampPageAssignments(nextAssignments);
    pendingFocusTripIdRef.current = target.id;
    setAssignments(nextAssignments);
    setStorageWarning(!stored);
    setRequestedPageIndex(pageIndex);
    setJustStampedPageNumber(pageNumber);
    // 찍었으면 여기서 끝. 이후에는 이전 장으로 가든 어디로 가든 자동 진행이 붙잡지 않는다.
    setStampFlowDone(true);
    if (impressionTimerRef.current !== null) {
      window.clearTimeout(impressionTimerRef.current);
      impressionTimerRef.current = null;
    }
    if (prefersReducedMotion) {
      setImprintingTripId(null);
    } else {
      setImprintingTripId(target.id);
      impressionTimerRef.current = window.setTimeout(() => {
        impressionTimerRef.current = null;
        setImprintingTripId(null);
      }, 520);
    }
    router.replace(
      getPassportStampIntentHref(target.id, stampReturnTo, pageNumber),
      { scroll: false },
    );
  }

  /** 젖혀지는 장. 앞으로 넘기면 지금 장, 뒤로 넘기면 이전 장이 돌아온다. */
  const turnTopPage =
    turn && turn.direction === "previous"
      ? pages[navigation.index - 1]
      : currentPage;

  /**
   * 여권은 왼쪽이 제본선이다. 앞으로 넘기면 **지금 장**이 왼쪽으로 젖혀지며 다음 장이
   * 드러나고, 뒤로 넘기면 왼쪽에 접혀 있던 **이전 장**이 되돌아오며 지금 장을 덮는다.
   * 드래그·버튼·키보드가 같은 진행률 하나를 공유한다.
   */
  const leaf = turn
    ? {
        top: turnTopPage,
        under:
          turn.direction === "next"
            ? pages[navigation.index + 1]
            : currentPage,
        angle:
          turn.direction === "next"
            ? -PAGE_TURN_MAX_ANGLE * turn.progress
            : -PAGE_TURN_MAX_ANGLE * (1 - turn.progress),
        /**
         * 곡면 음영의 세기. 종이는 완전히 펴졌을 때(0·1)가 아니라 반쯤 들렸을 때
         * 가장 굽으므로, 접힘량을 사인 곡선으로 바꿔 마루가 가장 밝게 만든다.
         */
        curve: Math.sin(turn.progress * Math.PI),
        castShadow: Math.sin(turn.progress * Math.PI) * 0.55,
        dragging: turn.dragging,
      }
    : null;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.matches("input, textarea, select, [role='textbox']"))
      ) {
        return;
      }

      if (event.key === "ArrowLeft" && navigation.previousIndex !== null) {
        event.preventDefault();
        turnBy("previous");
      }

      if (event.key === "ArrowRight" && navigation.nextIndex !== null) {
        event.preventDefault();
        turnBy("next");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigation.nextIndex, navigation.previousIndex, turnBy]);

  const stampIntentPageNumber =
    justStampedPageNumber ??
    (stampFlow.stampedPageIndex !== null
      ? stampFlow.stampedPageIndex + 1
      : stampPageNumber);
  const tripReturnTo = stampTripId
    ? getPassportStampIntentHref(
        stampTripId,
        stampReturnTo,
        stampIntentPageNumber ?? undefined,
      )
    : "/passport?view=stamps";
  /**
   * 상태 바는 **아직 할 일이 남았을 때만** 뜬다. 이미 찍힌 도장을 보러 온 경우엔 도장이
   * 종이에 있는 것으로 이야기가 끝나므로 보고 문구도 `돌아가기`도 두지 않는다.
   * 찍고 난 직후(`stampFlowDone`)도 마찬가지다 — 도장이 남은 것 자체가 결과다.
   */
  const showsStampFlow =
    !stampFlowDone &&
    (stampFlow.state === "select-page" ||
      stampFlow.state === "invalid-target");
  const stampStatusText =
    stampFlow.state === "invalid-target"
      ? "완료한 여행만 도장을 찍을 수 있어요"
      : stampFlow.target
        ? `${stampFlow.target.city} 도장을 찍을 쪽을 골라주세요`
        : "여권 도장";

  return (
    <div
      className="relative rounded-[24px] border border-[var(--passport-cover-edge)] px-[7px] pt-[3.25rem] pb-[7px] shadow-[0_16px_38px_rgba(8,29,50,0.28),inset_0_0_0_1px_rgba(224,198,125,0.2)]"
      style={coverStyle}
    >
      {/*
        표지 각인은 **문장 + 이름 한 덩어리**다. 여권 표지가 늘 그렇듯 가운데 정렬하고,
        설명 문구나 오른쪽 끝 배지를 곁들이지 않는다 — 표지에 이름이 두 번 적히는 실물
        여권은 없다. 줄 높이(h-9)는 그대로 두어 여권 본문 높이를 뺏지 않는다.
      */}
      {showsStampFlow ? (
        <div className="absolute inset-x-3 top-1 flex h-11 min-w-0 items-center justify-between gap-2 text-[var(--passport-foil)]">
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="min-w-0 flex-1 truncate text-[12px] leading-4 font-extrabold"
          >
            {storageWarning
              ? "도장은 찍혔지만 위치를 저장하지 못했어요"
              : stampStatusText}
          </p>
          <Link
            href={stampReturnTo}
            aria-label="여행 기록으로 돌아가기"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-full px-2 text-[11px] font-bold outline-none active:bg-white/10 focus-visible:ring-2 focus-visible:ring-[var(--passport-foil-focus)] motion-reduce:transition-none"
          >
            <ArrowLeft className="size-4" aria-hidden />
            돌아가기
          </Link>
        </div>
      ) : (
        <div
          aria-hidden
          className="absolute inset-x-4 top-2 flex h-9 items-center justify-center gap-2.5 text-[var(--passport-foil)]"
        >
          <DitoPassportEmblem />
          {/* leading-none + overflow-hidden 조합은 글자 윗변이 잘릴 수 있어 1.2를 준다. */}
          <span className="min-w-0 truncate text-[17px] leading-[1.2] font-black tracking-[0.12em] [text-shadow:0_1px_0_rgba(255,255,255,0.1)] min-[360px]:text-[19px] min-[360px]:tracking-[0.14em]">
            DITO PASSPORT
          </span>
        </div>
      )}

      {/*
       * `data-turning`은 **넘기는 동안에만** 3D 렌더링 문맥을 만든다.
       * `perspective` + `preserve-3d` + `backface-visibility`가 항상 켜져 있으면 내지가
       * 늘 합성 레이어로 승격되고, 모바일 브라우저는 그런 레이어를 기기 픽셀이 아니라
       * 낮은 배율로 래스터한 뒤 확대한다 — 도장의 SVG 필터(feTurbulence)가 그 확대를
       * 가장 먼저 드러내서 "깨져" 보인다. 가만히 있을 때는 평범한 2D DOM으로 두면
       * 브라우저가 기기 해상도 그대로 그린다.
       */}
      <div
        id={pageViewId}
        data-turning={leaf || coverState === "opening" ? "" : undefined}
        {...(coverState === "open" ? dragHandlers : {})}
        className="passport-book relative touch-pan-y overflow-hidden rounded-[15px] border border-[var(--passport-foil-page)] bg-[var(--passport-gutter)] shadow-[inset_0_0_24px_rgba(24,69,88,0.18)] select-none"
      >
        {/* 젖혀지는 장 아래에서 드러나는 목적지 페이지 + 그 위에 지는 그림자 */}
        {leaf?.under ? (
          <div aria-hidden className="passport-under">
            <PassportPhysicalPage
              page={leaf.under}
              pageNumber={leaf.under.pageNumber}
              hasPageNavigation={hasPageNavigation}
              tripReturnTo={tripReturnTo}
              imprintingTripId={imprintingTripId}
            />
            <span
              className="passport-cast-shadow"
              style={{ opacity: leaf.castShadow }}
            />
          </div>
        ) : null}

        {/*
          내지는 표지가 닫혀 있는 동안만 비활성이다. `inert`를 책 전체에 걸면 **표지 버튼도
          그 안에 있어서** 자기 자신까지 막혀 열 수 없게 된다.
        */}
        <div
          data-dragging={leaf?.dragging || undefined}
          aria-hidden={coverState === "closed" ? true : undefined}
          inert={coverState === "closed" ? true : undefined}
          style={
            leaf
              ? ({
                  transform: `rotateY(${leaf.angle}deg)`,
                  "--flip-p": leaf.curve,
                } as CSSProperties)
              : undefined
          }
          className="passport-leaf"
        >
          <div className="passport-face passport-face--front grid min-[700px]:max-[900px]:grid-cols-2 min-[700px]:max-[900px]:gap-px">
            <PassportPhysicalPage
              page={turnTopPage}
              pageNumber={turnTopPage?.pageNumber ?? 1}
              showEmptyMessage={trips.length === 0}
              hasPageNavigation={hasPageNavigation}
              tripReturnTo={tripReturnTo}
              imprintingTripId={imprintingTripId}
              focusStampTripId={justStampedTripId}
              focusStampLinkRef={focusStampLinkRef}
              stampChoice={
                !turn &&
                stampFlow.state === "select-page" &&
                turnTopPage &&
                stampFlow.target
                  ? {
                      city: stampFlow.target.city,
                      selectable: stampFlow.selectablePageIndices.includes(
                        turnTopPage.index,
                      ),
                      onSelect: () => selectStampPage(turnTopPage.index),
                    }
                  : undefined
              }
            />
            <PassportPhysicalPage
              page={nextFoldPage}
              pageNumber={nextFoldPage?.pageNumber ?? currentPage.pageNumber + 1}
              foldOnly
              hasPageNavigation={hasPageNavigation}
              tripReturnTo={tripReturnTo}
              imprintingTripId={imprintingTripId}
              focusStampTripId={justStampedTripId}
              focusStampLinkRef={focusStampLinkRef}
              stampChoice={
                !turn &&
                stampFlow.state === "select-page" &&
                nextFoldPage &&
                stampFlow.target
                  ? {
                      city: stampFlow.target.city,
                      selectable: stampFlow.selectablePageIndices.includes(
                        nextFoldPage.index,
                      ),
                      onSelect: () => selectStampPage(nextFoldPage.index),
                    }
                  : undefined
              }
            />
          </div>

          {/* 종이의 뒷면. 넘기는 내내 장을 불투명하게 유지한다. */}
          {leaf ? (
            <div
              aria-hidden
              className="passport-face passport-face--back"
              style={pageStyle}
            >
              <PassportSecurityPaper
                pageNumber={(leaf.top?.pageNumber ?? 1) + 1}
              />
            </div>
          ) : null}
        </div>

        {/*
          닫힌 표지. 여권은 펼쳐진 채로 시작하지 않는다 — 표지를 먼저 보여 주고 사용자가
          열어야 안이 나온다. 넘김과 **같은 제본선(왼쪽)**을 축으로 도는 한 장이므로,
          쪽 넘김에 쓰는 3D 문맥을 그대로 재사용한다.

          전환은 CSS로 둔다. 넘김은 손끝을 따라가야 해서 rAF가 필요했지만, 표지 열기는
          되감기도 중간 개입도 없는 한 번짜리라 `transitionend` 한 번이면 끝난다.
        */}
        {coverState !== "open" ? (
          <>
            {/* 표지가 아래 내지에 드리우는 그림자 — 쪽 넘김과 같은 처리다. */}
            <span
              aria-hidden
              className="passport-cast-shadow"
              style={{ opacity: Math.sin(coverProgress * Math.PI) * 0.55 }}
            />
            <button
              type="button"
              onClick={openCover}
              aria-label={`여권 열기 — 완료한 여행 ${trips.length}개`}
              className="passport-cover-leaf"
              style={
                {
                  transform: `rotateY(${-PAGE_TURN_MAX_ANGLE * coverProgress}deg)`,
                  "--flip-p": Math.sin(coverProgress * Math.PI),
                } as CSSProperties
              }
            >
              {/*
                표지도 **앞뒤 두 면**을 갖는다. 한 면만 두면 젖혀지는 내내 두께가 없는
                종이 쪼가리처럼 보인다 — 쪽 넘김에서 이미 겪고 고친 문제다.
              */}
              <span className="passport-face passport-cover-face" style={coverStyle}>
                <span className="flex size-full flex-col items-center justify-center gap-3 text-[var(--passport-foil)]">
                  <DitoPassportEmblem />
                  <span className="text-[19px] leading-[1.2] font-black tracking-[0.14em] [text-shadow:0_1px_0_rgba(255,255,255,0.1)]">
                    DITO PASSPORT
                  </span>
                  {coverState === "closed" ? (
                    <span className="passport-cover-hint mt-3 rounded-full border border-[var(--passport-foil)]/45 px-3 py-1.5 text-[11px] font-bold tracking-[0.1em]">
                      눌러서 펼치기
                    </span>
                  ) : null}
                </span>
              </span>
              {/* 표지 안쪽 — 도장 없는 면지. */}
              <span
                aria-hidden
                className="passport-face passport-face--back"
                style={pageStyle}
              />
            </button>
          </>
        ) : null}
      </div>

      {hasPageNavigation && coverState === "open" ? (
        <nav
          aria-label="여권 페이지"
          className="pointer-events-none absolute inset-x-4 bottom-4 z-20 flex items-center justify-between min-[360px]:inset-x-5"
        >
          <button
            type="button"
            disabled={!navigation.canGoPrevious}
            aria-controls={pageViewId}
            aria-label={
              navigation.previousIndex === null
                ? "이전 장 없음"
                : `이전 장, ${targetPageLabel(navigation.previousIndex)}`
            }
            onClick={() => turnBy("previous")}
            className="pointer-events-auto inline-flex min-h-11 min-w-[4.5rem] items-center justify-center gap-0.5 rounded-full border border-[var(--passport-rule-2)] bg-[var(--passport-paper-nav)]/95 px-2 text-[11px] font-bold text-[var(--passport-ink-nav)] shadow-sm outline-none transition-colors duration-120 active:bg-[var(--passport-paper-press)] disabled:opacity-25 focus-visible:ring-2 focus-visible:ring-[var(--passport-foil-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--passport-cover)] motion-reduce:transition-none"
          >
            <ChevronLeft className="size-4" aria-hidden />
            이전 장
          </button>

          <span
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="rounded-full border border-[var(--passport-rule-3)]/60 bg-[var(--passport-paper-nav)]/95 px-2.5 py-1.5 text-[10px] font-bold text-[var(--passport-ink-2)] tabular-nums shadow-sm"
          >
            <span aria-hidden>{currentPageRange.positionLabel}</span>
            <span className="sr-only">
              총 {pages.length}쪽 중 {currentPageRange.pageLabel}. 좌우로 밀어
              넘길 수 있어요.
            </span>
          </span>

          <button
            type="button"
            disabled={!navigation.canGoNext}
            aria-controls={pageViewId}
            aria-label={
              navigation.nextIndex === null
                ? "다음 장 없음"
                : `다음 장, ${targetPageLabel(navigation.nextIndex)}`
            }
            onClick={() => turnBy("next")}
            className="pointer-events-auto inline-flex min-h-11 min-w-[4.5rem] items-center justify-center gap-0.5 rounded-full border border-[var(--passport-rule-2)] bg-[var(--passport-paper-nav)]/95 px-2 text-[11px] font-bold text-[var(--passport-ink-nav)] shadow-sm outline-none transition-colors duration-120 active:bg-[var(--passport-paper-press)] disabled:opacity-25 focus-visible:ring-2 focus-visible:ring-[var(--passport-foil-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--passport-cover)] motion-reduce:transition-none"
          >
            다음 장
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </nav>
      ) : null}
    </div>
  );
}

export function PassportScreen({
  embedded = false,
  stampTripId = null,
  stampPageNumber = null,
  stampReturnTo = "/passport?view=stamps",
  previewTrips,
}: {
  embedded?: boolean;
  stampTripId?: string | null;
  stampPageNumber?: number | null;
  stampReturnTo?: string;
  /** 디자인 미리보기용 목데이터 — 지정 시 서버 조회를 건너뛴다 */
  previewTrips?: readonly Trip[];
} = {}) {
  const hydrated = useHydrated();
  const { data: trips = [], isLoading } = useTrips();
  const archivedTrips = getCompletedPassportTrips(previewTrips ?? trips);
  const passportLoading = previewTrips ? !hydrated : !hydrated || isLoading;

  const screen = (
    <main
      aria-labelledby={embedded ? "passport-stamps-heading" : undefined}
      className={cn(
        "flex w-full flex-col gap-3",
        embedded &&
          "px-2 pt-3 min-[360px]:px-3 min-[700px]:max-[900px]:px-4",
      )}
    >
      {embedded ? (
        /* 임베드에서는 허브 탭이 이미 "여권"임을 말하고 표지에 브랜드가 있다.
           제목·개수를 또 얹으면 중복이고, 그만큼 여권이 화면 밖으로 밀린다. */
        <h2 id="passport-stamps-heading" className="sr-only">
          {getPassportStampHeadingLabel(passportLoading, archivedTrips.length)}
        </h2>
      ) : (
        <header className="flex min-h-16 items-end justify-between gap-3 px-2 pb-1">
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.18em] text-[var(--passport-eyebrow)]">
              DITO TRAVEL MEMORY
            </p>
            <h1 className="mt-0.5 text-[24px] leading-8 font-extrabold tracking-[-0.04em] text-foreground">
              나의 여권
            </h1>
          </div>
          <p className="pb-1 text-right text-[12px] font-semibold text-[var(--passport-ink-2)]">
            <span role="status">
              {passportLoading
                ? "기록 불러오는 중"
                : `완료한 여행 ${archivedTrips.length}개`}
            </span>
            {!passportLoading && archivedTrips.length > 2 ? (
              <span
                aria-hidden
                className="mt-0.5 block text-[11px] font-medium text-[var(--passport-ink-3)]"
              >
                밀어서 넘기기
              </span>
            ) : null}
          </p>
        </header>
      )}

      {passportLoading ? (
        <div
          className="flex h-[var(--passport-page-height)] items-center justify-center rounded-[24px] border-[7px] border-[var(--passport-cover)] bg-[var(--passport-paper-load)] px-5 text-center shadow-[0_16px_38px_rgba(8,29,50,0.2)]"
          aria-busy="true"
        >
          <p
            className="text-[13px] font-medium text-[var(--passport-ink-2)]"
            role="status"
          >
            여권을 펼치는 중…
          </p>
        </div>
      ) : (
        <PassportBook
          key={stampTripId ?? "passport-browse"}
          trips={archivedTrips}
          stampTripId={stampTripId}
          stampPageNumber={stampPageNumber}
          stampReturnTo={stampReturnTo}
        />
      )}
    </main>
  );

  if (embedded) return screen;

  return (
    <AppShell
      withBottomNav
      className="px-2 min-[360px]:px-3 min-[700px]:max-[900px]:px-4"
    >
      {screen}
    </AppShell>
  );
}
