import {
  PASSPORT_STAMP_PROPORTIONS,
  getPassportStampArtworkGeometry,
  type PassportStampGeometry,
} from "@/features/profile/components/passport-stamp-artwork";
import { PASSPORT_TRIPS_PER_PAGE } from "@/features/profile/utils/passport-pagination";
import {
  getPassportStampDesign,
  getPassportStampTextureSeed,
} from "@/features/profile/utils/passport-stamp";
import type { Trip } from "@/features/trips/types";

/**
 * 배치는 **비율 공간(0–100%)에서만** 계산한다.
 *
 * 예전에는 256×320이라는 가상의 px 캔버스에서 도장 위치를 잡았는데, 실제 내지는
 * 기기마다 270×295(작은 화면)부터 364×566(큰 화면)까지 가로세로비가 완전히 달라서
 * 그 캔버스는 어느 기기와도 맞지 않았다.
 *
 * 그 다음에 쓴 2×2 정사각 격자도 세로로 긴 화면에서는 비었다. 정사각 칸(145×218)에
 * 정사각 도장(145×145)을 넣으면 칸마다 세로 73px이 버려지고, 그게 두 줄이라 화면
 * 한가운데가 통째로 남았다 — 잉크가 종이의 43%밖에 덮지 못했다.
 *
 * 지금은 **4단 계단**이다. 좌우를 번갈아 가며 네 단이 종이 세로를 처음부터 끝까지 훑는다.
 *
 * 각도와 겹침은 **실제 출입국 도장 규정**을 따른다. EU Practical Handbook for Border
 * Guards(Schengen Borders Code 부속서 IV의 실무 지침)는 도장을 *가로 방향으로 찍어 읽기
 * 쉽게* 하고, *이미 찍힌 도장 위에 겹쳐 찍지 말며*, *가능하면 시간 순서대로* 찍으라고
 * 권고한다. 그래서 여기서도:
 *
 * - 도장은 **거의 똑바로 선다**(전체 −6°~+5°). 각도를 크게 주면 여권이 아니라 스티커
 *   콜라주로 보인다 — 실무 지침이 가로 방향을 요구하는 이유가 그대로 시각에도 적용된다
 * - 이웃한 단끼리 **모서리만 살짝 물린다**(최대 14%). 두 단 이상 떨어진 도장은 절대
 *   겹치지 않는다 — 포개지면 기록을 못 읽는다
 * - 채우는 순서는 **위에서 아래로**, 곧 시간 순서다
 *
 * 단 간격과 좌우는 자리마다 **불규칙하게** 둔다(`CELL_PATTERNS`). 등간격에 좌우 두 값만
 * 쓰면 규칙이 그대로 읽혀 손으로 찍은 것처럼 보이지 않는다.
 */
export const PASSPORT_STAMP_CELL = { width: 55, height: 39 } as const;

/** 두 단 이상 떨어진 칸 사이에 반드시 남는 여백(%). 이웃 단에는 적용하지 않는다. */
export const PASSPORT_STAMP_CELL_GUTTER = 1;

export type PassportStampLayoutPattern =
  | "top-run"
  | "left-run"
  | "close-pair"
  | "late-drop"
  | "even-run";

type PassportStampLayoutTrip = Pick<
  Trip,
  "id" | "country" | "city" | "endDate"
>;

/** 칸 하나. 좌상단 기준이며 단위는 내지 대비 %다. */
export type PassportStampCell = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PassportStampPlacement = {
  tripId: string;
  pattern: PassportStampLayoutPattern;
  cell: PassportStampCell;
  /**
   * 칸 안에서 도장이 **추가로** 기우는 각도(자리별 기울기 + 여행별 흔들림).
   * 나라별 기본 각도는 도장 아트워크가 스스로 적용하므로, 마크업에서 얹는 값은
   * 이 차이분뿐이다.
   */
  rotationOffset: number;
  /** 기본 각도까지 합친 실제 기울기. 칸에 들어갈 크기를 이 값으로 푼다. */
  rotation: number;
  /** 도장 원본 가로/세로 비율. */
  aspectRatio: number;
  /**
   * 칸을 채우는 폭을 푸는 두 제수(除數). 실제 폭은
   * `min(100cqw / widthFactor, 100cqh / heightFactor)`이다 — 기운 도장의
   * **회전 후 외곽**이 칸을 넘지 않는 가장 큰 값이라, 이웃 도장과 겹칠 수 없다.
   */
  widthFactor: number;
  heightFactor: number;
};

/** 자리 하나 — 칸 좌상단과 그 자리에서 도장이 눕는 각도. */
type PlacementSlot = Pick<PassportStampCell, "left" | "top"> & {
  tilt: number;
};

type PlacementPattern = {
  name: PassportStampLayoutPattern;
  /** 채우는 순서대로 나열한다 — 도장이 네 개보다 적으면 앞에서부터 쓴다. */
  cells: readonly PlacementSlot[];
};

const FALLBACK_GEOMETRY = {
  round: "round",
  rectangle: "wide",
  oval: "oval",
  square: "square",
  polygon: "polygon",
} as const satisfies Record<
  ReturnType<typeof getPassportStampDesign>["shape"],
  PassportStampGeometry
>;

/**
 * 자리표. 위에서 아래로 한 단씩 내려가며 좌우를 번갈아 밟는다 — 실제 여권도 위부터
 * 채우므로 채우는 순서가 곧 시간 순서이자 보이는 순서다.
 *
 * **자리 기울기는 ±2°까지다.** 실무 지침이 요구하는 "가로 방향"을 지키면서 손으로 누른
 * 미세한 어긋남만 남긴다. 각도를 키우면 채움은 좋아지지만 여권이 아니라 스티커가 된다.
 *
 * **불규칙은 각도가 아니라 간격으로 만든다.** 단 간격을 똑같이(20/20/20) 두고 좌우를 두
 * 값으로만 쓰면 "좌우 번갈아, 등간격"이라는 규칙이 그대로 읽힌다. 세 간격을 서로 다르게
 * 주고(예: 17/28/16) 좌우도 같은 쪽 안에서 어긋나게 한다.
 *
 * 지켜야 하는 두 제약:
 * - 마지막 단은 `top 61`이라 네 단이 종이 세로를 정확히 채운다
 * - 두 단 이상 떨어진 칸은 `PASSPORT_STAMP_CELL_GUTTER` 이상 떨어진다 — 같은 자리에
 *   포개지면 기록을 못 읽는다. 그래서 `top[i] + 높이 + 여백 ≤ top[i+2]`가 항상 참이다
 */
const CELL_PATTERNS: readonly PlacementPattern[] = [
  {
    name: "top-run",
    cells: [
      { left: 0, top: 0, tilt: -2 },
      { left: 43, top: 19, tilt: 2 },
      { left: 2, top: 44, tilt: -1 },
      { left: 45, top: 61, tilt: 2 },
    ],
  },
  {
    name: "left-run",
    cells: [
      { left: 42, top: 0, tilt: 2 },
      { left: 0, top: 20, tilt: -2 },
      { left: 45, top: 42, tilt: 1 },
      { left: 3, top: 61, tilt: -2 },
    ],
  },
  {
    name: "close-pair",
    cells: [
      { left: 2, top: 0, tilt: -1 },
      { left: 44, top: 17, tilt: 2 },
      { left: 0, top: 45, tilt: -2 },
      { left: 43, top: 61, tilt: 1 },
    ],
  },
  {
    name: "late-drop",
    cells: [
      { left: 45, top: 0, tilt: 1 },
      { left: 3, top: 21, tilt: -2 },
      { left: 42, top: 43, tilt: 2 },
      { left: 0, top: 61, tilt: -1 },
    ],
  },
  {
    name: "even-run",
    cells: [
      { left: 0, top: 0, tilt: -2 },
      { left: 42, top: 21, tilt: 1 },
      { left: 1, top: 41, tilt: -1 },
      { left: 44, top: 61, tilt: 2 },
    ],
  },
];

function geometryForTrip(trip: PassportStampLayoutTrip): PassportStampGeometry {
  const design = getPassportStampDesign(trip);
  return (
    getPassportStampArtworkGeometry(design.family) ??
    FALLBACK_GEOMETRY[design.shape]
  );
}

/**
 * 두 칸이 겹치는지 본다. **이웃한 단(index 차 1)에는 쓰지 않는다** — 계단이 좌우로
 * 조금 물려야 도장이 커지므로 이웃끼리 모서리가 닿는 것은 의도한 결과다(잉크 기준
 * 최대 14%). 두 단 이상 떨어진 칸에만 적용해, 같은 자리에 도장이 포개지는 일을 막는다.
 */
export function passportStampCellsOverlap(
  first: PassportStampCell,
  second: PassportStampCell,
  gap = PASSPORT_STAMP_CELL_GUTTER,
) {
  return !(
    first.left + first.width + gap <= second.left ||
    second.left + second.width + gap <= first.left ||
    first.top + first.height + gap <= second.top ||
    second.top + second.height + gap <= first.top
  );
}

export function isPassportStampCellWithinPage(cell: PassportStampCell) {
  return (
    cell.left >= 0 &&
    cell.top >= 0 &&
    cell.left + cell.width <= 100 &&
    cell.top + cell.height <= 100
  );
}

function stablePageSeed(
  trips: readonly PassportStampLayoutTrip[],
  pageNumber: number,
) {
  return trips.reduce(
    (seed, trip, index) =>
      (seed ^
        Math.imul(getPassportStampTextureSeed(trip), 31 + index * 17)) >>>
      0,
    Math.imul(Math.max(1, Math.trunc(pageNumber)), 2_654_435_761) >>> 0,
  );
}

/**
 * 여행마다 달라지는 미세한 흔들림. 도장은 가로로 서 있어야 하므로 ±1°만 흔든다 —
 * 같은 자리에 다른 여행이 와도 똑같아 보이지 않을 최소치다.
 * 크기는 **줄이기만** 한다 — 1을 넘기면 회전 여유로 계산해 둔 칸을 도장이 넘어선다.
 */
function impressionVariation(trip: PassportStampLayoutTrip, index: number) {
  const seed =
    (getPassportStampTextureSeed(trip) ^ Math.imul(index + 1, 40503)) >>> 0;
  const rotationOffsets = [-1, 1] as const;
  const scales = [0.94, 0.97, 1, 0.97] as const;

  return {
    rotationOffset: rotationOffsets[seed % rotationOffsets.length],
    scale: scales[(seed >>> 4) % scales.length],
  };
}

/**
 * 제수는 **올림**한다. 반올림하면 값이 아주 조금 작아질 수 있고, 제수가 작아지면
 * 도장이 커져서 칸을 서브픽셀만큼 넘는다. 올림하면 그 방향으로는 절대 틀리지 않는다.
 */
function roundFactor(value: number) {
  return Math.ceil(value * 10_000) / 10_000;
}

/**
 * 기운 도장이 칸을 넘지 않는 최대 폭을 푼다.
 *
 * 폭 `w`, 높이 `w / ar`인 도장을 `θ`만큼 돌리면 외곽은
 * `w(|cosθ| + |sinθ|/ar) × w(|sinθ| + |cosθ|/ar)`가 된다. 이 외곽이 칸 안에
 * 들어가야 하므로 두 제수 중 더 빡빡한 쪽이 폭을 정한다. CSS는 칸을 컨테이너로
 * 삼아 `min(100cqw / widthFactor, 100cqh / heightFactor)`로 같은 식을 푼다.
 */
function fitFactors(aspectRatio: number, rotation: number, scale: number) {
  const radians = (Math.abs(rotation) * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    widthFactor: roundFactor((cos + sin / aspectRatio) / scale),
    heightFactor: roundFactor((sin + cos / aspectRatio) / scale),
  };
}

/**
 * 렌더 시점의 난수 없이 손으로 찍은 듯한 구성을 고른다. 같은 여행과 같은 물리
 * 페이지는 언제나 같은 결과를 낸다. 자리표가 이미 검증된 배치이고 도장은 자기 칸 안에서만
 * 커지므로, 예전처럼 배치 후보를 렌더 시점에 충돌 검사할 필요가 없다.
 */
export function getPassportStampPlacements(
  trips: readonly PassportStampLayoutTrip[],
  { pageNumber = 1 }: { pageNumber?: number } = {},
): PassportStampPlacement[] {
  const visibleTrips = trips.slice(0, PASSPORT_TRIPS_PER_PAGE);
  if (visibleTrips.length === 0) return [];

  const pattern =
    CELL_PATTERNS[
      stablePageSeed(visibleTrips, pageNumber) % CELL_PATTERNS.length
    ];

  return visibleTrips.map((trip, index) => {
    const design = getPassportStampDesign(trip);
    const variation = impressionVariation(trip, index);
    const aspectRatio = PASSPORT_STAMP_PROPORTIONS[geometryForTrip(trip)];
    const { left, top, tilt } = pattern.cells[index];
    const rotationOffset = tilt + variation.rotationOffset;
    const rotation = design.rotation + rotationOffset;

    return {
      tripId: trip.id,
      pattern: pattern.name,
      cell: { left, top, ...PASSPORT_STAMP_CELL },
      rotationOffset,
      rotation,
      aspectRatio,
      ...fitFactors(aspectRatio, rotation, variation.scale),
    } satisfies PassportStampPlacement;
  });
}
