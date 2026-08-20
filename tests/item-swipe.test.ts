import assert from "node:assert/strict";
import test from "node:test";
import {
  clampItemDeleteSwipeOffset,
  getItemSwipeAxis,
  ITEM_DELETE_REVEAL_WIDTH,
  shouldRevealItemDelete,
} from "../features/shopping-items/utils/item-swipe";

test("세로 이동이 더 크면 상품 삭제 스와이프로 처리하지 않는다", () => {
  assert.equal(getItemSwipeAxis(-14, 28), "vertical");
  assert.equal(getItemSwipeAxis(-12, -12), "vertical");
});

test("작은 흔들림은 축을 결정하지 않고 왼쪽 이동만 가로 스와이프가 된다", () => {
  assert.equal(getItemSwipeAxis(-5, 1), "pending");
  assert.equal(getItemSwipeAxis(-20, 4), "horizontal");
});

test("상품 표면은 닫힌 위치와 72px 열린 위치 사이에서만 움직인다", () => {
  assert.equal(clampItemDeleteSwipeOffset(0, 24), 0);
  assert.equal(clampItemDeleteSwipeOffset(0, -24), -24);
  assert.equal(
    clampItemDeleteSwipeOffset(0, -120),
    -ITEM_DELETE_REVEAL_WIDTH,
  );
  assert.equal(clampItemDeleteSwipeOffset(-72, 120), 0);
});

test("56px 미만 스와이프는 닫히고 56px부터 삭제 버튼만 연다", () => {
  assert.equal(shouldRevealItemDelete(-55), false);
  assert.equal(shouldRevealItemDelete(-56), true);
  assert.equal(shouldRevealItemDelete(-72), true);
});
