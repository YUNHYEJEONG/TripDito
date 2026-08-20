export const ITEM_DELETE_REVEAL_WIDTH = 72;
export const ITEM_DELETE_REVEAL_THRESHOLD = 56;
export const ITEM_SWIPE_AXIS_THRESHOLD = 6;

export type ItemSwipeAxis = "pending" | "horizontal" | "vertical";

export function getItemSwipeAxis(
  deltaX: number,
  deltaY: number,
): ItemSwipeAxis {
  if (
    Math.max(Math.abs(deltaX), Math.abs(deltaY)) <
    ITEM_SWIPE_AXIS_THRESHOLD
  ) {
    return "pending";
  }
  return Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
}

export function clampItemDeleteSwipeOffset(
  startOffset: number,
  deltaX: number,
) {
  return Math.max(
    -ITEM_DELETE_REVEAL_WIDTH,
    Math.min(0, startOffset + deltaX),
  );
}

export function shouldRevealItemDelete(offset: number) {
  return offset <= -ITEM_DELETE_REVEAL_THRESHOLD;
}
