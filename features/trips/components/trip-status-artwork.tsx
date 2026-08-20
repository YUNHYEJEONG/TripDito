import type { CSSProperties } from "react";
import styles from "./trip-status-artwork.module.css";

export type TripStatusArtworkScene = "packing" | "transit" | "unpacking";

type TripStatusSuitcaseArtworkProps = {
  scene: TripStatusArtworkScene;
  fillPercent: number;
  activeSlots: number;
  overflowCount: number;
  purchasedCount: number;
};

type BudgetReservoirArtworkProps = {
  fillPercent: number;
};

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function BudgetReservoirArtwork({
  fillPercent,
}: BudgetReservoirArtworkProps) {
  const safePercent = clampPercent(fillPercent);
  const liquidTravel = 106;
  const style = {
    "--reservoir-fill-offset": `${
      ((100 - safePercent) / 100) * liquidTravel
    }px`,
  } as CSSProperties;

  return (
    <svg
      className={styles.reservoirSvg}
      viewBox="0 0 44 132"
      preserveAspectRatio="xMidYMid meet"
      data-has-fill={safePercent > 0 ? "true" : "false"}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="trip-status-reservoir-liquid"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0" stopColor="#32aaa3" />
          <stop offset="0.58" stopColor="#108682" />
          <stop offset="1" stopColor="#076d6b" />
        </linearGradient>
        <clipPath id="trip-status-reservoir-clip">
          <path d="M13 19C13 15.8 15.4 14 18.5 14h8.2c3.2 0 5.3 2.2 5.3 5.4v94.8c0 4.6-2.7 7.3-7.2 7.8h-4.9c-4.3-.5-6.9-3.2-6.9-7.8V19Z" />
        </clipPath>
      </defs>

      <ellipse
        className={styles.reservoirShadow}
        cx="22.5"
        cy="130.2"
        rx="14"
        ry="1.5"
      />
      <path
        className={styles.reservoirGlassBack}
        d="M8.4 4.8v109c0 10.6 5.6 17.1 14.1 17.1s14.1-6.5 14.1-17.1V4.8H8.4Z"
      />
      <path
        className={styles.reservoirSideShade}
        d="M32 7.6h3.1v105.6c0 7.4-3.1 12.2-8.1 14.7 3.3-4.2 5-9 5-14.7V7.6Z"
      />

      <g clipPath="url(#trip-status-reservoir-clip)">
        <rect className={styles.reservoirEmptyWell} x="13" y="14" width="19" height="108" />
        <g data-budget-gauge-fill className={styles.reservoirLiquidGroup}>
          <rect
            className={styles.reservoirLiquidBody}
            x="12"
            y="14"
            width="21"
            height="108"
            fill="url(#trip-status-reservoir-liquid)"
          />
          <ellipse
            key={`reservoir-surface-${safePercent}`}
            className={styles.reservoirMeniscus}
            cx="22.5"
            cy="15.8"
            rx="10.5"
            ry="2.5"
          />
        </g>
      </g>

      <path
        className={styles.reservoirGlassOutline}
        d="M8.4 4.8v109c0 10.6 5.6 17.1 14.1 17.1s14.1-6.5 14.1-17.1V4.8H8.4Z"
      />
      <ellipse
        className={styles.reservoirRimOuter}
        cx="22.5"
        cy="4.8"
        rx="14.1"
        ry="4"
      />
      <ellipse
        className={styles.reservoirRimInner}
        cx="22.5"
        cy="4.55"
        rx="10.9"
        ry="1.9"
      />
      <circle className={styles.reservoirReflectionDot} cx="16.8" cy="27.5" r="1.8" />
      <path
        className={styles.reservoirReflectionGlint}
        d="M15.6 39c-.5 7.8-.4 15.5.1 23"
      />
    </svg>
  );
}

export function TripStatusSuitcaseArtwork({
  scene,
  fillPercent,
  activeSlots,
  overflowCount,
  purchasedCount,
}: TripStatusSuitcaseArtworkProps) {
  const safePercent = clampPercent(fillPercent);
  const style = {
    "--suitcase-fill-offset": `${100 - safePercent}%`,
  } as CSSProperties;

  return (
    <span
      className={styles.suitcaseArtwork}
      data-approved-suitcase-scene={scene}
      data-packed-count={Math.max(0, activeSlots)}
      data-overflow-count={Math.max(0, overflowCount)}
      data-purchased-count={Math.max(0, purchasedCount)}
      data-has-fill={safePercent > 0 ? "true" : "false"}
      style={style}
      aria-hidden="true"
    >
      <span data-suitcase-scene-frame className={styles.suitcaseScene}>
        {scene === "packing" ? null : (
          <span className={styles.suitcaseFillMask}>
            <span className={styles.suitcaseWindowBase} />
            <span
              data-trip-suitcase-fill
              className={styles.suitcaseLiquid}
            >
              <span
                key={`suitcase-surface-${safePercent}`}
                className={styles.suitcaseMeniscus}
              />
            </span>
            <span className={styles.suitcaseReflectionDot} />
            <span className={styles.suitcaseReflectionGlint} />
          </span>
        )}
        <span className={styles.suitcaseFrame} />
      </span>
    </span>
  );
}
