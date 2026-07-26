"use client";

import {
  GIFT_TAG_OPTIONS,
  type GiftTagId,
} from "../constants/gift-tags";

/**
 * 구매완료 + 선물 대상 태그 (홈 쇼핑리스트 / 상세 공통)
 * - 구매완료가 선물 대상보다 앞
 * - soft pastel 톤 (구매완료와 동일 톤앤매너)
 */
export function ItemStatusTags({
  purchased = false,
  giftTags = [],
  className = "mb-1 flex flex-wrap items-center gap-1",
}: {
  purchased?: boolean;
  giftTags?: GiftTagId[];
  className?: string;
}) {
  if (!purchased && !giftTags.length) return null;

  return (
    <div className={className}>
      {purchased ? (
        <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
          구매완료
        </span>
      ) : null}
      {giftTags.map((id) => {
        const option = GIFT_TAG_OPTIONS.find((tag) => tag.id === id);
        if (!option) return null;
        return (
          <span
            key={id}
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: option.bg, color: option.text }}
          >
            {option.label}
          </span>
        );
      })}
    </div>
  );
}
