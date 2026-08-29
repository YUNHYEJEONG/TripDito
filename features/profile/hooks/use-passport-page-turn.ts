"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

/** 넘김으로 판정하는 진행률과, 짧게 튕겼을 때의 속도 임계값(px/ms). */
const COMMIT_PROGRESS = 0.32;
const FLICK_VELOCITY = 0.4;
/** 세로 스크롤과 가로 넘김을 가르는 축 판정 시작 거리. */
const AXIS_LOCK_DISTANCE = 10;
/** 넘길 장이 없을 때 따라가는 비율(고무줄 저항). */
const RUBBER_BAND = 0.16;
/**
 * 0 → 1 을 다 넘기는 데 드는 시간. 남은 구간만큼만 비례해서 쓴다.
 * 회전 범위가 90°(한 면만 보이는 뷰라 그 이상은 화면 밖)라 180° 시절의 560ms를
 * 그대로 두면 절반 속도로 느껴진다.
 */
export const FULL_TURN_MS = 340;

export type PassportTurnDirection = "previous" | "next";

type DragSession = {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  width: number;
  axis: "undecided" | "horizontal" | "vertical";
};

type TurnState = {
  direction: PassportTurnDirection;
  progress: number;
  /** 손끝을 따라가는 중이면 전환을 걸지 않는다. */
  dragging: boolean;
};

export type PassportPageTurnOptions = {
  canGoPrevious: boolean;
  canGoNext: boolean;
  /** 넘김이 끝난 뒤에만 호출된다. 여기서 쪽수를 확정한다. */
  onTurnComplete: (direction: PassportTurnDirection) => void;
  reducedMotion?: boolean;
};

export function easeOutTurn(t: number) {
  return 1 - (1 - t) ** 3;
}

function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}

/**
 * 여권 넘김의 단일 진입점. 드래그·버튼·키보드가 모두 같은 진행률(0→1)을 움직이며,
 * **손을 뗀 지점에서 이어서** 끝까지 굴린다. CSS 애니메이션을 쓰지 않으므로
 * 되감기·중복 재생이 원천적으로 생기지 않는다.
 */
export function usePassportPageTurn({
  canGoPrevious,
  canGoNext,
  onTurnComplete,
  reducedMotion = false,
}: PassportPageTurnOptions) {
  const sessionRef = useRef<DragSession | null>(null);
  const movedRef = useRef(false);
  const turnRef = useRef<TurnState | null>(null);
  const frameRef = useRef<number | null>(null);
  const [turn, setTurn] = useState<TurnState | null>(null);

  const apply = useCallback((next: TurnState | null) => {
    turnRef.current = next;
    setTurn(next);
  }, []);

  const stopFrame = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);

  useEffect(() => stopFrame, [stopFrame]);

  /**
   * 현재 진행률에서 목표(1=넘김 완료, 0=되돌리기)까지 굴린다.
   * 남은 거리에 비례해 시간을 잡아, 많이 끌어 놓고 놓았을 때 늘어지지 않는다.
   */
  const glideTo = useCallback(
    (target: 0 | 1, direction: PassportTurnDirection) => {
      stopFrame();
      const from = turnRef.current?.progress ?? (target === 1 ? 0 : 1);
      const distance = Math.abs(target - from);

      if (reducedMotion || distance < 0.001) {
        apply(null);
        if (target === 1) onTurnComplete(direction);
        return;
      }

      const duration = FULL_TURN_MS * distance;
      const start = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const progress = from + (target - from) * easeOut(t);
        apply({ direction, progress, dragging: false });

        if (t < 1) {
          frameRef.current = requestAnimationFrame(step);
          return;
        }
        frameRef.current = null;
        apply(null);
        if (target === 1) onTurnComplete(direction);
      };

      frameRef.current = requestAnimationFrame(step);
    },
    [apply, onTurnComplete, reducedMotion, stopFrame],
  );

  /** 버튼·키보드 넘김. 처음부터 끝까지 굴린다. */
  const turnBy = useCallback(
    (direction: PassportTurnDirection) => {
      if (turnRef.current || frameRef.current !== null) return;
      if (direction === "previous" ? !canGoPrevious : !canGoNext) return;
      apply({ direction, progress: 0, dragging: false });
      glideTo(1, direction);
    },
    [apply, canGoNext, canGoPrevious, glideTo],
  );

  const allows = useCallback(
    (delta: number) => (delta > 0 ? canGoPrevious : canGoNext),
    [canGoPrevious, canGoNext],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (!canGoPrevious && !canGoNext) return;
      if (frameRef.current !== null) return;

      sessionRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startTime: event.timeStamp,
        width: event.currentTarget.getBoundingClientRect().width || 1,
        axis: "undecided",
      };
      movedRef.current = false;
    },
    [canGoPrevious, canGoNext],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const session = sessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      const dx = event.clientX - session.startX;
      const dy = event.clientY - session.startY;

      if (session.axis === "undecided") {
        if (Math.hypot(dx, dy) < AXIS_LOCK_DISTANCE) return;
        session.axis = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
        if (session.axis === "horizontal") {
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }
      }
      if (session.axis !== "horizontal") return;

      movedRef.current = true;
      if (reducedMotion || dx === 0) return;

      const ratio = Math.min(1, Math.abs(dx) / session.width);
      apply({
        direction: dx > 0 ? "previous" : "next",
        progress: allows(dx) ? ratio : ratio * RUBBER_BAND,
        dragging: true,
      });
    },
    [allows, apply, reducedMotion],
  );

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>, commit: boolean) => {
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session && event.currentTarget.hasPointerCapture?.(session.pointerId)) {
        event.currentTarget.releasePointerCapture(session.pointerId);
      }
      const active = turnRef.current;
      if (!session || session.axis !== "horizontal" || !active) {
        if (active) apply(null);
        return;
      }

      const dx = event.clientX - session.startX;
      const elapsed = Math.max(1, event.timeStamp - session.startTime);
      const passed =
        commit &&
        allows(dx) &&
        (active.progress > COMMIT_PROGRESS ||
          Math.abs(dx) / elapsed > FLICK_VELOCITY);

      // 손을 뗀 지점에서 이어 굴린다 — 되감았다가 다시 넘기지 않는다.
      glideTo(passed ? 1 : 0, active.direction);
    },
    [allows, apply, glideTo],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => endDrag(event, true),
    [endDrag],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => endDrag(event, false),
    [endDrag],
  );

  /** 드래그로 움직였다면 도장 링크의 클릭을 삼킨다. */
  const onClickCapture = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    if (!movedRef.current) return;
    movedRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onClickCapture,
    },
    turn,
    turnBy,
    isTurning: turn !== null,
  };
}
